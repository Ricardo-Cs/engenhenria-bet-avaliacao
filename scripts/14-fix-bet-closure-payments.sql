-- Script para corrigir o sistema de pagamento ao fechar apostas
-- Este script corrige a função close_bet para garantir que os pagamentos sejam processados

-- Primeiro, vamos verificar o estado atual das apostas e pagamentos
SELECT 
  'Current bet status' as info,
  b.id,
  b.title,
  b.status,
  b.winning_option_id,
  bo.name as winning_option_name
FROM public.bets b
LEFT JOIN public.bet_options bo ON b.winning_option_id = bo.id
WHERE b.status = 'closed'
ORDER BY b.updated_at DESC
LIMIT 5;

-- Verificar apostas de usuários que deveriam ter ganho
SELECT 
  'User bets that should have won' as info,
  ub.id,
  ub.user_id,
  ub.bet_id,
  ub.amount,
  ub.odds,
  ub.status,
  ub.potential_payout,
  ub.actual_payout,
  u.email,
  u.balance,
  b.title as bet_title,
  bo.name as chosen_option,
  winning_bo.name as winning_option
FROM public.user_bets ub
JOIN public.users u ON ub.user_id = u.id
JOIN public.bets b ON ub.bet_id = b.id
JOIN public.bet_options bo ON ub.bet_option_id = bo.id
LEFT JOIN public.bet_options winning_bo ON b.winning_option_id = winning_bo.id
WHERE b.status = 'closed'
  AND ub.bet_option_id = b.winning_option_id
  AND ub.status != 'won'
ORDER BY ub.placed_at DESC;

-- Função corrigida para fechar apostas com pagamentos adequados
CREATE OR REPLACE FUNCTION public.close_bet_fixed(
  bet_id_param UUID,
  winning_option_id_param UUID
)
RETURNS JSON AS $$
DECLARE
  total_payout DECIMAL(10,2) := 0;
  bet_exists BOOLEAN := FALSE;
  option_exists BOOLEAN := FALSE;
  winning_bets_count INTEGER := 0;
  losing_bets_count INTEGER := 0;
  bet_title TEXT;
  winning_option_name TEXT;
BEGIN
  -- Check if bet exists and is active
  SELECT EXISTS(
    SELECT 1 FROM public.bets 
    WHERE id = bet_id_param AND status = 'active'
  ), title INTO bet_exists, bet_title
  FROM public.bets 
  WHERE id = bet_id_param;
  
  IF NOT bet_exists THEN
    RETURN json_build_object(
      'success', false,
      'error', 'Bet not found or already closed'
    );
  END IF;
  
  -- Check if winning option exists for this bet
  SELECT EXISTS(
    SELECT 1 FROM public.bet_options 
    WHERE id = winning_option_id_param AND bet_id = bet_id_param
  ), name INTO option_exists, winning_option_name
  FROM public.bet_options 
  WHERE id = winning_option_id_param AND bet_id = bet_id_param;
  
  IF NOT option_exists THEN
    RETURN json_build_object(
      'success', false,
      'error', 'Invalid winning option for this bet'
    );
  END IF;

  -- Log the closure attempt
  RAISE NOTICE 'Closing bet % (%) with winning option % (%)', bet_id_param, bet_title, winning_option_id_param, winning_option_name;

  -- Update bet status and winning option FIRST
  UPDATE public.bets 
  SET status = 'closed', 
      winning_option_id = winning_option_id_param,
      updated_at = NOW()
  WHERE id = bet_id_param;

  -- Update winning user bets and count them
  UPDATE public.user_bets 
  SET status = 'won',
      actual_payout = amount * odds
  WHERE bet_id = bet_id_param 
    AND bet_option_id = winning_option_id_param
    AND status = 'active';
    
  GET DIAGNOSTICS winning_bets_count = ROW_COUNT;
  RAISE NOTICE 'Updated % winning bets', winning_bets_count;

  -- Update losing user bets and count them
  UPDATE public.user_bets 
  SET status = 'lost',
      actual_payout = 0
  WHERE bet_id = bet_id_param 
    AND bet_option_id != winning_option_id_param
    AND status = 'active';
    
  GET DIAGNOSTICS losing_bets_count = ROW_COUNT;
  RAISE NOTICE 'Updated % losing bets', losing_bets_count;

  -- Calculate total payout
  SELECT COALESCE(SUM(actual_payout), 0) INTO total_payout
  FROM public.user_bets 
  WHERE bet_id = bet_id_param AND status = 'won';
  
  RAISE NOTICE 'Total payout calculated: %', total_payout;

  -- Update user balances for winners - THIS IS THE CRITICAL PART
  UPDATE public.users 
  SET balance = balance + ub.actual_payout,
      updated_at = NOW()
  FROM public.user_bets ub
  WHERE users.id = ub.user_id 
    AND ub.bet_id = bet_id_param 
    AND ub.status = 'won'
    AND ub.actual_payout > 0;

  -- Get count of users whose balance was updated
  DECLARE
    updated_users_count INTEGER;
  BEGIN
    SELECT COUNT(*) INTO updated_users_count
    FROM public.user_bets ub
    WHERE ub.bet_id = bet_id_param 
      AND ub.status = 'won'
      AND ub.actual_payout > 0;
    
    RAISE NOTICE 'Updated balance for % users', updated_users_count;
  END;

  RETURN json_build_object(
    'success', true,
    'total_payout', total_payout,
    'winning_bets', winning_bets_count,
    'losing_bets', losing_bets_count,
    'bet_title', bet_title,
    'winning_option', winning_option_name,
    'message', 'Bet closed successfully with payments processed'
  );
EXCEPTION
  WHEN OTHERS THEN
    RAISE NOTICE 'Error in close_bet_fixed: %', SQLERRM;
    RETURN json_build_object(
      'success', false,
      'error', 'Failed to close bet: ' || SQLERRM
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Função para corrigir apostas já fechadas que não pagaram os vencedores
CREATE OR REPLACE FUNCTION public.fix_unpaid_winners()
RETURNS JSON AS $$
DECLARE
  fixed_count INTEGER := 0;
  total_fixed_payout DECIMAL(10,2) := 0;
  bet_record RECORD;
  user_record RECORD;
BEGIN
  -- Find all closed bets with unpaid winners
  FOR bet_record IN 
    SELECT DISTINCT b.id, b.title, b.winning_option_id
    FROM public.bets b
    JOIN public.user_bets ub ON b.id = ub.bet_id
    WHERE b.status = 'closed'
      AND b.winning_option_id IS NOT NULL
      AND ub.bet_option_id = b.winning_option_id
      AND ub.status != 'won'
  LOOP
    RAISE NOTICE 'Fixing bet: % (%)', bet_record.id, bet_record.title;
    
    -- Update winning user bets
    UPDATE public.user_bets 
    SET status = 'won',
        actual_payout = amount * odds
    WHERE bet_id = bet_record.id 
      AND bet_option_id = bet_record.winning_option_id
      AND status != 'won';

    -- Update losing user bets
    UPDATE public.user_bets 
    SET status = 'lost',
        actual_payout = 0
    WHERE bet_id = bet_record.id 
      AND bet_option_id != bet_record.winning_option_id
      AND status != 'lost';

    -- Pay the winners
    FOR user_record IN
      SELECT ub.user_id, ub.actual_payout
      FROM public.user_bets ub
      WHERE ub.bet_id = bet_record.id 
        AND ub.status = 'won'
        AND ub.actual_payout > 0
    LOOP
      UPDATE public.users 
      SET balance = balance + user_record.actual_payout,
          updated_at = NOW()
      WHERE id = user_record.user_id;
      
      total_fixed_payout := total_fixed_payout + user_record.actual_payout;
      RAISE NOTICE 'Paid % to user %', user_record.actual_payout, user_record.user_id;
    END LOOP;
    
    fixed_count := fixed_count + 1;
  END LOOP;

  RETURN json_build_object(
    'success', true,
    'fixed_bets', fixed_count,
    'total_payout', total_fixed_payout,
    'message', 'Fixed unpaid winners successfully'
  );
EXCEPTION
  WHEN OTHERS THEN
    RETURN json_build_object(
      'success', false,
      'error', 'Failed to fix unpaid winners: ' || SQLERRM
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Executar a correção para apostas já fechadas
SELECT public.fix_unpaid_winners();

-- Verificar o resultado após a correção
SELECT 
  'After fix - User bets status' as info,
  ub.id,
  ub.user_id,
  ub.bet_id,
  ub.amount,
  ub.odds,
  ub.status,
  ub.potential_payout,
  ub.actual_payout,
  u.email,
  u.balance,
  b.title as bet_title,
  bo.name as chosen_option,
  winning_bo.name as winning_option
FROM public.user_bets ub
JOIN public.users u ON ub.user_id = u.id
JOIN public.bets b ON ub.bet_id = b.id
JOIN public.bet_options bo ON ub.bet_option_id = bo.id
LEFT JOIN public.bet_options winning_bo ON b.winning_option_id = winning_bo.id
WHERE b.status = 'closed'
ORDER BY ub.placed_at DESC;

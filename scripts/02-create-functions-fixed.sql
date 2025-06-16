-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at
DROP TRIGGER IF EXISTS update_users_updated_at ON public.users;
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON public.users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_bets_updated_at ON public.bets;
CREATE TRIGGER update_bets_updated_at BEFORE UPDATE ON public.bets
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to handle user registration
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (id, email, full_name)
  VALUES (
    NEW.id, 
    NEW.email, 
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', '')
  );
  RETURN NEW;
EXCEPTION
  WHEN unique_violation THEN
    -- User already exists, do nothing
    RETURN NEW;
  WHEN OTHERS THEN
    -- Log error but don't fail the auth process
    RAISE WARNING 'Failed to create user profile: %', SQLERRM;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop existing trigger if exists
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Create trigger for new user registration
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Function to process bet closure with better error handling
CREATE OR REPLACE FUNCTION public.close_bet(
  bet_id_param UUID,
  winning_option_id_param UUID
)
RETURNS JSON AS $$
DECLARE
  total_payout DECIMAL(10,2) := 0;
  bet_exists BOOLEAN := FALSE;
  option_exists BOOLEAN := FALSE;
BEGIN
  -- Check if bet exists and is active
  SELECT EXISTS(
    SELECT 1 FROM public.bets 
    WHERE id = bet_id_param AND status = 'active'
  ) INTO bet_exists;
  
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
  ) INTO option_exists;
  
  IF NOT option_exists THEN
    RETURN json_build_object(
      'success', false,
      'error', 'Invalid winning option for this bet'
    );
  END IF;

  -- Update bet status and winning option
  UPDATE public.bets 
  SET status = 'closed', 
      winning_option_id = winning_option_id_param,
      updated_at = NOW()
  WHERE id = bet_id_param;

  -- Update winning user bets
  UPDATE public.user_bets 
  SET status = 'won',
      actual_payout = amount * odds
  WHERE bet_id = bet_id_param 
    AND bet_option_id = winning_option_id_param
    AND status = 'active';

  -- Update losing user bets
  UPDATE public.user_bets 
  SET status = 'lost',
      actual_payout = 0
  WHERE bet_id = bet_id_param 
    AND bet_option_id != winning_option_id_param
    AND status = 'active';

  -- Calculate total payout
  SELECT COALESCE(SUM(actual_payout), 0) INTO total_payout
  FROM public.user_bets 
  WHERE bet_id = bet_id_param AND status = 'won';

  -- Update user balances for winners
  UPDATE public.users 
  SET balance = balance + ub.actual_payout,
      updated_at = NOW()
  FROM public.user_bets ub
  WHERE users.id = ub.user_id 
    AND ub.bet_id = bet_id_param 
    AND ub.status = 'won';

  RETURN json_build_object(
    'success', true,
    'total_payout', total_payout,
    'message', 'Bet closed successfully'
  );
EXCEPTION
  WHEN OTHERS THEN
    RETURN json_build_object(
      'success', false,
      'error', 'Failed to close bet: ' || SQLERRM
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

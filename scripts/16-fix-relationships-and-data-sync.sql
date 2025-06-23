-- Script para corrigir relacionamentos duplicados e problemas de sincronização

-- 1. Verificar relacionamentos existentes
SELECT 
  tc.table_name, 
  kcu.column_name, 
  ccu.table_name AS foreign_table_name,
  ccu.column_name AS foreign_column_name,
  tc.constraint_name
FROM information_schema.table_constraints AS tc 
JOIN information_schema.key_column_usage AS kcu
  ON tc.constraint_name = kcu.constraint_name
  AND tc.table_schema = kcu.table_schema
JOIN information_schema.constraint_column_usage AS ccu
  ON ccu.constraint_name = tc.constraint_name
  AND ccu.table_schema = tc.table_schema
WHERE tc.constraint_type = 'FOREIGN KEY' 
  AND tc.table_schema = 'public'
  AND (tc.table_name = 'bets' OR tc.table_name = 'bet_options' OR tc.table_name = 'user_bets')
ORDER BY tc.table_name, tc.constraint_name;

-- 2. Verificar se há foreign keys duplicadas ou problemáticas
SELECT 
  conname as constraint_name,
  conrelid::regclass as table_name,
  confrelid::regclass as referenced_table,
  pg_get_constraintdef(oid) as constraint_definition
FROM pg_constraint 
WHERE contype = 'f' 
  AND (conrelid::regclass::text IN ('public.bets', 'public.bet_options', 'public.user_bets'))
ORDER BY conrelid::regclass;

-- 3. Remover constraints problemáticas se existirem
DO $$
DECLARE
    constraint_record RECORD;
BEGIN
    -- Remove constraints duplicadas ou problemáticas
    FOR constraint_record IN 
        SELECT conname, conrelid::regclass as table_name
        FROM pg_constraint 
        WHERE contype = 'f' 
          AND conrelid::regclass::text = 'public.bets'
          AND confrelid::regclass::text = 'public.bet_options'
    LOOP
        EXECUTE format('ALTER TABLE %s DROP CONSTRAINT IF EXISTS %s', 
                      constraint_record.table_name, 
                      constraint_record.conname);
        RAISE NOTICE 'Dropped constraint % from %', constraint_record.conname, constraint_record.table_name;
    END LOOP;
END $$;

-- 4. Recriar estrutura limpa das tabelas
-- Primeiro, fazer backup dos dados
CREATE TEMP TABLE bets_backup AS SELECT * FROM public.bets;
CREATE TEMP TABLE bet_options_backup AS SELECT * FROM public.bet_options;
CREATE TEMP TABLE user_bets_backup AS SELECT * FROM public.user_bets;

-- 5. Recriar tabelas com relacionamentos corretos
DROP TABLE IF EXISTS public.user_bets CASCADE;
DROP TABLE IF EXISTS public.bet_options CASCADE;
DROP TABLE IF EXISTS public.bets CASCADE;

-- Recriar tabela bets (sem foreign key para bet_options ainda)
CREATE TABLE public.bets (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  category TEXT NOT NULL,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'closed', 'cancelled')),
  end_date TIMESTAMP WITH TIME ZONE NOT NULL,
  winning_option_id UUID, -- Será linkado depois
  created_by UUID REFERENCES public.users(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Recriar tabela bet_options
CREATE TABLE public.bet_options (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  bet_id UUID NOT NULL REFERENCES public.bets(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  odds DECIMAL(5,2) NOT NULL CHECK (odds > 0),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(bet_id, name)
);

-- Agora adicionar a foreign key de bets para bet_options
ALTER TABLE public.bets 
ADD CONSTRAINT fk_bets_winning_option 
FOREIGN KEY (winning_option_id) REFERENCES public.bet_options(id) ON DELETE SET NULL;

-- Recriar tabela user_bets
CREATE TABLE public.user_bets (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  bet_id UUID NOT NULL REFERENCES public.bets(id) ON DELETE CASCADE,
  bet_option_id UUID NOT NULL REFERENCES public.bet_options(id) ON DELETE CASCADE,
  amount DECIMAL(10,2) NOT NULL CHECK (amount > 0),
  odds DECIMAL(5,2) NOT NULL CHECK (odds > 0),
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'won', 'lost', 'cancelled')),
  potential_payout DECIMAL(10,2) NOT NULL,
  actual_payout DECIMAL(10,2) DEFAULT 0,
  placed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 6. Restaurar dados
INSERT INTO public.bets SELECT * FROM bets_backup;
INSERT INTO public.bet_options SELECT * FROM bet_options_backup;
INSERT INTO public.user_bets SELECT * FROM user_bets_backup;

-- 7. Recriar índices
CREATE INDEX idx_bets_status ON public.bets(status);
CREATE INDEX idx_bets_category ON public.bets(category);
CREATE INDEX idx_bets_end_date ON public.bets(end_date);
CREATE INDEX idx_bet_options_bet_id ON public.bet_options(bet_id);
CREATE INDEX idx_user_bets_user_id ON public.user_bets(user_id);
CREATE INDEX idx_user_bets_bet_id ON public.user_bets(bet_id);
CREATE INDEX idx_user_bets_status ON public.user_bets(status);

-- 8. Verificar integridade dos dados após recriação
SELECT 'Bets count' as table_name, COUNT(*) as count FROM public.bets;
SELECT 'Bet options count' as table_name, COUNT(*) as count FROM public.bet_options;
SELECT 'User bets count' as table_name, COUNT(*) as count FROM public.user_bets;

-- 9. Verificar relacionamentos finais
SELECT 
  tc.table_name, 
  kcu.column_name, 
  ccu.table_name AS foreign_table_name,
  ccu.column_name AS foreign_column_name,
  tc.constraint_name
FROM information_schema.table_constraints AS tc 
JOIN information_schema.key_column_usage AS kcu
  ON tc.constraint_name = kcu.constraint_name
JOIN information_schema.constraint_column_usage AS ccu
  ON ccu.constraint_name = tc.constraint_name
WHERE tc.constraint_type = 'FOREIGN KEY' 
  AND tc.table_schema = 'public'
  AND tc.table_name IN ('bets', 'bet_options', 'user_bets')
ORDER BY tc.table_name;

-- 10. Função para forçar refresh de dados
CREATE OR REPLACE FUNCTION public.force_data_refresh()
RETURNS JSON AS $$
BEGIN
  -- Atualizar timestamp de todos os usuários para forçar refresh
  UPDATE public.users SET updated_at = NOW();
  
  -- Retornar estatísticas
  RETURN json_build_object(
    'users_updated', (SELECT COUNT(*) FROM public.users),
    'bets_count', (SELECT COUNT(*) FROM public.bets),
    'user_bets_count', (SELECT COUNT(*) FROM public.user_bets),
    'timestamp', NOW()
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

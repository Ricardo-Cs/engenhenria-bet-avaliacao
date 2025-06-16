-- Enable Row Level Security on all tables
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bet_options ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_bets ENABLE ROW LEVEL SECURITY;

-- Drop all existing policies first
DO $$ 
DECLARE
    r RECORD;
BEGIN
    -- Drop all policies on users table
    FOR r IN (SELECT policyname FROM pg_policies WHERE tablename = 'users' AND schemaname = 'public') LOOP
        EXECUTE 'DROP POLICY IF EXISTS ' || quote_ident(r.policyname) || ' ON public.users';
    END LOOP;
    
    -- Drop all policies on bets table
    FOR r IN (SELECT policyname FROM pg_policies WHERE tablename = 'bets' AND schemaname = 'public') LOOP
        EXECUTE 'DROP POLICY IF EXISTS ' || quote_ident(r.policyname) || ' ON public.bets';
    END LOOP;
    
    -- Drop all policies on bet_options table
    FOR r IN (SELECT policyname FROM pg_policies WHERE tablename = 'bet_options' AND schemaname = 'public') LOOP
        EXECUTE 'DROP POLICY IF EXISTS ' || quote_ident(r.policyname) || ' ON public.bet_options';
    END LOOP;
    
    -- Drop all policies on user_bets table
    FOR r IN (SELECT policyname FROM pg_policies WHERE tablename = 'user_bets' AND schemaname = 'public') LOOP
        EXECUTE 'DROP POLICY IF EXISTS ' || quote_ident(r.policyname) || ' ON public.user_bets';
    END LOOP;
END $$;

-- RLS Policies for users table
CREATE POLICY "users_select_own" ON public.users
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "users_update_own" ON public.users
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "users_select_admin" ON public.users
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.users 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- RLS Policies for bets table
CREATE POLICY "bets_select_all" ON public.bets
  FOR SELECT USING (true);

CREATE POLICY "bets_insert_admin" ON public.bets
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.users 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "bets_update_admin" ON public.bets
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.users 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "bets_delete_admin" ON public.bets
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM public.users 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- RLS Policies for bet_options table
CREATE POLICY "bet_options_select_all" ON public.bet_options
  FOR SELECT USING (true);

CREATE POLICY "bet_options_insert_admin" ON public.bet_options
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.users 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "bet_options_update_admin" ON public.bet_options
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.users 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "bet_options_delete_admin" ON public.bet_options
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM public.users 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- RLS Policies for user_bets table
CREATE POLICY "user_bets_select_own" ON public.user_bets
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "user_bets_insert_own" ON public.user_bets
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "user_bets_update_own" ON public.user_bets
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "user_bets_select_admin" ON public.user_bets
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.users 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "user_bets_update_admin" ON public.user_bets
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.users 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

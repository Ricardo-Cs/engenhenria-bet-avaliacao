-- Enable Row Level Security
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bet_options ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_bets ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view own profile" ON public.users;
DROP POLICY IF EXISTS "Users can update own profile" ON public.users;
DROP POLICY IF EXISTS "Admins can view all users" ON public.users;
DROP POLICY IF EXISTS "Anyone can view active bets" ON public.bets;
DROP POLICY IF EXISTS "Admins can manage bets" ON public.bets;
DROP POLICY IF EXISTS "Anyone can view bet options" ON public.bet_options;
DROP POLICY IF EXISTS "Admins can manage bet options" ON public.bet_options;
DROP POLICY IF EXISTS "Users can view own bets" ON public.user_bets;
DROP POLICY IF EXISTS "Users can place bets" ON public.user_bets;
DROP POLICY IF EXISTS "Admins can view all user bets" ON public.user_bets;

-- RLS Policies for users table
CREATE POLICY "Users can view own profile" ON public.users
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON public.users
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Admins can view all users" ON public.users
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.users 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- RLS Policies for bets table
CREATE POLICY "Anyone can view active bets" ON public.bets
  FOR SELECT USING (status = 'active' OR auth.uid() IS NOT NULL);

CREATE POLICY "Admins can manage bets" ON public.bets
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.users 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- RLS Policies for bet_options table
CREATE POLICY "Anyone can view bet options" ON public.bet_options
  FOR SELECT USING (true);

CREATE POLICY "Admins can manage bet options" ON public.bet_options
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.users 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- RLS Policies for user_bets table
CREATE POLICY "Users can view own bets" ON public.user_bets
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can place bets" ON public.user_bets
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can view all user bets" ON public.user_bets
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.users 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

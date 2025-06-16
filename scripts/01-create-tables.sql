-- Create users table (extends Supabase auth.users)
CREATE TABLE IF NOT EXISTS public.users (
  id UUID REFERENCES auth.users(id) PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  full_name TEXT,
  role TEXT DEFAULT 'user' CHECK (role IN ('user', 'admin')),
  balance DECIMAL(10,2) DEFAULT 1000.00,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create bets table
CREATE TABLE IF NOT EXISTS public.bets (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  category TEXT NOT NULL,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'closed', 'cancelled')),
  end_date TIMESTAMP WITH TIME ZONE NOT NULL,
  winning_option_id UUID,
  created_by UUID REFERENCES public.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create bet_options table
CREATE TABLE IF NOT EXISTS public.bet_options (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  bet_id UUID REFERENCES public.bets(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  odds DECIMAL(5,2) NOT NULL CHECK (odds > 0),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create user_bets table
CREATE TABLE IF NOT EXISTS public.user_bets (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.users(id),
  bet_id UUID REFERENCES public.bets(id),
  bet_option_id UUID REFERENCES public.bet_options(id),
  amount DECIMAL(10,2) NOT NULL CHECK (amount > 0),
  odds DECIMAL(5,2) NOT NULL,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'won', 'lost', 'cancelled')),
  potential_payout DECIMAL(10,2) NOT NULL,
  actual_payout DECIMAL(10,2) DEFAULT 0,
  placed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_bets_status ON public.bets(status);
CREATE INDEX IF NOT EXISTS idx_bets_category ON public.bets(category);
CREATE INDEX IF NOT EXISTS idx_user_bets_user_id ON public.user_bets(user_id);
CREATE INDEX IF NOT EXISTS idx_user_bets_bet_id ON public.user_bets(bet_id);
CREATE INDEX IF NOT EXISTS idx_user_bets_status ON public.user_bets(status);

-- Add foreign key constraint for winning_option_id
ALTER TABLE public.bets 
ADD CONSTRAINT fk_bets_winning_option 
FOREIGN KEY (winning_option_id) REFERENCES public.bet_options(id);

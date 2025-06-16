-- Drop all existing tables and recreate them with proper relationships
-- This will fix the "more than one relationship" error

-- Drop tables in correct order (child tables first)
DROP TABLE IF EXISTS public.user_bets CASCADE;
DROP TABLE IF EXISTS public.bet_options CASCADE;
DROP TABLE IF EXISTS public.bets CASCADE;
DROP TABLE IF EXISTS public.users CASCADE;

-- Drop functions and triggers
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user();
DROP FUNCTION IF EXISTS public.close_bet(UUID, UUID);
DROP FUNCTION IF EXISTS update_updated_at_column();

-- Recreate users table
CREATE TABLE public.users (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  full_name TEXT,
  role TEXT DEFAULT 'user' CHECK (role IN ('user', 'admin')),
  balance DECIMAL(10,2) DEFAULT 1000.00,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Recreate bets table
CREATE TABLE public.bets (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  category TEXT NOT NULL,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'closed', 'cancelled')),
  end_date TIMESTAMP WITH TIME ZONE NOT NULL,
  winning_option_id UUID, -- Will be linked after bet_options is created
  created_by UUID REFERENCES public.users(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Recreate bet_options table
CREATE TABLE public.bet_options (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  bet_id UUID NOT NULL REFERENCES public.bets(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  odds DECIMAL(5,2) NOT NULL CHECK (odds > 0),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(bet_id, name) -- Prevent duplicate option names for same bet
);

-- Now add the foreign key constraint for winning_option_id
ALTER TABLE public.bets 
ADD CONSTRAINT fk_bets_winning_option 
FOREIGN KEY (winning_option_id) REFERENCES public.bet_options(id) ON DELETE SET NULL;

-- Recreate user_bets table
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

-- Create indexes for better performance
CREATE INDEX idx_bets_status ON public.bets(status);
CREATE INDEX idx_bets_category ON public.bets(category);
CREATE INDEX idx_bets_end_date ON public.bets(end_date);
CREATE INDEX idx_bet_options_bet_id ON public.bet_options(bet_id);
CREATE INDEX idx_user_bets_user_id ON public.user_bets(user_id);
CREATE INDEX idx_user_bets_bet_id ON public.user_bets(bet_id);
CREATE INDEX idx_user_bets_status ON public.user_bets(status);
CREATE INDEX idx_users_email ON public.users(email);
CREATE INDEX idx_users_role ON public.users(role);

-- Recreate functions
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at
CREATE TRIGGER update_users_updated_at 
    BEFORE UPDATE ON public.users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_bets_updated_at 
    BEFORE UPDATE ON public.bets
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to handle user registration
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (id, email, full_name)
  VALUES (
    NEW.id, 
    NEW.email, 
    COALESCE(
      NEW.raw_user_meta_data->>'full_name', 
      NEW.raw_user_meta_data->>'name', 
      ''
    )
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

-- Create trigger for new user registration
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Function to process bet closure
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

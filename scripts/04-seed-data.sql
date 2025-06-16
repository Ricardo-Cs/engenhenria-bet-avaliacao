-- Insert sample bets with proper UUIDs
INSERT INTO public.bets (id, title, description, category, end_date, created_by) VALUES
(
  gen_random_uuid(),
  'Eleições Presidenciais 2024',
  'Quem será o próximo presidente do Brasil?',
  'politica',
  NOW() + INTERVAL '30 days',
  NULL
),
(
  gen_random_uuid(),
  'Oscar 2024 - Melhor Filme',
  'Qual filme ganhará o Oscar de Melhor Filme?',
  'entretenimento',
  NOW() + INTERVAL '15 days',
  NULL
),
(
  gen_random_uuid(),
  'Bitcoin chegará a $100.000?',
  'O Bitcoin atingirá $100.000 até o final do ano?',
  'economia',
  NOW() + INTERVAL '60 days',
  NULL
);

-- Get the bet IDs for inserting options
-- We'll use a different approach with variables
DO $$
DECLARE
    eleicoes_id UUID;
    oscar_id UUID;
    bitcoin_id UUID;
BEGIN
    -- Get the bet IDs we just created
    SELECT id INTO eleicoes_id FROM public.bets WHERE title = 'Eleições Presidenciais 2024' LIMIT 1;
    SELECT id INTO oscar_id FROM public.bets WHERE title = 'Oscar 2024 - Melhor Filme' LIMIT 1;
    SELECT id INTO bitcoin_id FROM public.bets WHERE title = 'Bitcoin chegará a $100.000?' LIMIT 1;
    
    -- Insert bet options for Eleições
    INSERT INTO public.bet_options (bet_id, name, odds) VALUES
    (eleicoes_id, 'Candidato A', 2.50),
    (eleicoes_id, 'Candidato B', 1.80),
    (eleicoes_id, 'Candidato C', 3.20);
    
    -- Insert bet options for Oscar
    INSERT INTO public.bet_options (bet_id, name, odds) VALUES
    (oscar_id, 'Oppenheimer', 1.50),
    (oscar_id, 'Barbie', 2.80),
    (oscar_id, 'Killers of the Flower Moon', 4.00);
    
    -- Insert bet options for Bitcoin
    INSERT INTO public.bet_options (bet_id, name, odds) VALUES
    (bitcoin_id, 'Sim', 2.20),
    (bitcoin_id, 'Não', 1.70);
END $$;

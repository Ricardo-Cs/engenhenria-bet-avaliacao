-- Clear existing data first
TRUNCATE public.bet_options CASCADE;
TRUNCATE public.user_bets CASCADE;
TRUNCATE public.bets CASCADE;

-- Insert bets one by one and then their options
-- Bet 1: Eleições
INSERT INTO public.bets (title, description, category, end_date) 
VALUES ('Eleições Presidenciais 2024', 'Quem será o próximo presidente do Brasil?', 'politica', NOW() + INTERVAL '30 days');

INSERT INTO public.bet_options (bet_id, name, odds) 
SELECT 
  (SELECT id FROM public.bets WHERE title = 'Eleições Presidenciais 2024'),
  option.name,
  option.odds
FROM (VALUES 
  ('Candidato A', 2.50),
  ('Candidato B', 1.80),
  ('Candidato C', 3.20)
) AS option(name, odds);

-- Bet 2: Oscar
INSERT INTO public.bets (title, description, category, end_date) 
VALUES ('Oscar 2024 - Melhor Filme', 'Qual filme ganhará o Oscar de Melhor Filme?', 'entretenimento', NOW() + INTERVAL '15 days');

INSERT INTO public.bet_options (bet_id, name, odds) 
SELECT 
  (SELECT id FROM public.bets WHERE title = 'Oscar 2024 - Melhor Filme'),
  option.name,
  option.odds
FROM (VALUES 
  ('Oppenheimer', 1.50),
  ('Barbie', 2.80),
  ('Killers of the Flower Moon', 4.00)
) AS option(name, odds);

-- Bet 3: Bitcoin
INSERT INTO public.bets (title, description, category, end_date) 
VALUES ('Bitcoin chegará a $100.000?', 'O Bitcoin atingirá $100.000 até o final do ano?', 'economia', NOW() + INTERVAL '60 days');

INSERT INTO public.bet_options (bet_id, name, odds) 
SELECT 
  (SELECT id FROM public.bets WHERE title = 'Bitcoin chegará a $100.000?'),
  option.name,
  option.odds
FROM (VALUES 
  ('Sim', 2.20),
  ('Não', 1.70)
) AS option(name, odds);

-- Verify the data was inserted correctly
SELECT 
  b.title,
  b.category,
  b.status,
  bo.name as option_name,
  bo.odds
FROM public.bets b
JOIN public.bet_options bo ON b.id = bo.bet_id
ORDER BY b.title, bo.name;

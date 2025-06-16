-- Insert sample bets and options
-- Clear any existing data first
TRUNCATE public.user_bets CASCADE;
TRUNCATE public.bet_options CASCADE;
TRUNCATE public.bets CASCADE;

-- Insert bets
INSERT INTO public.bets (id, title, description, category, end_date) VALUES
(
  '11111111-1111-1111-1111-111111111111',
  'Eleições Presidenciais 2024',
  'Quem será o próximo presidente do Brasil?',
  'politica',
  NOW() + INTERVAL '30 days'
),
(
  '22222222-2222-2222-2222-222222222222',
  'Oscar 2024 - Melhor Filme',
  'Qual filme ganhará o Oscar de Melhor Filme?',
  'entretenimento',
  NOW() + INTERVAL '15 days'
),
(
  '33333333-3333-3333-3333-333333333333',
  'Bitcoin chegará a $100.000?',
  'O Bitcoin atingirá $100.000 até o final do ano?',
  'economia',
  NOW() + INTERVAL '60 days'
);

-- Insert bet options
INSERT INTO public.bet_options (bet_id, name, odds) VALUES
-- Eleições options
('11111111-1111-1111-1111-111111111111', 'Candidato A', 2.50),
('11111111-1111-1111-1111-111111111111', 'Candidato B', 1.80),
('11111111-1111-1111-1111-111111111111', 'Candidato C', 3.20),

-- Oscar options
('22222222-2222-2222-2222-222222222222', 'Oppenheimer', 1.50),
('22222222-2222-2222-2222-222222222222', 'Barbie', 2.80),
('22222222-2222-2222-2222-222222222222', 'Killers of the Flower Moon', 4.00),

-- Bitcoin options
('33333333-3333-3333-3333-333333333333', 'Sim', 2.20),
('33333333-3333-3333-3333-333333333333', 'Não', 1.70);

-- Verify the data
SELECT 
  b.title,
  b.category,
  b.status,
  bo.name as option_name,
  bo.odds
FROM public.bets b
JOIN public.bet_options bo ON b.id = bo.bet_id
ORDER BY b.title, bo.name;

-- Clear existing data first (optional)
DELETE FROM public.bet_options;
DELETE FROM public.user_bets;
DELETE FROM public.bets;

-- Insert sample bets and get their IDs
WITH inserted_bets AS (
  INSERT INTO public.bets (title, description, category, end_date, created_by) VALUES
  ('Eleições Presidenciais 2024', 'Quem será o próximo presidente do Brasil?', 'politica', NOW() + INTERVAL '30 days', NULL),
  ('Oscar 2024 - Melhor Filme', 'Qual filme ganhará o Oscar de Melhor Filme?', 'entretenimento', NOW() + INTERVAL '15 days', NULL),
  ('Bitcoin chegará a $100.000?', 'O Bitcoin atingirá $100.000 até o final do ano?', 'economia', NOW() + INTERVAL '60 days', NULL)
  RETURNING id, title
),
bet_options_data AS (
  SELECT 
    ib.id as bet_id,
    option_data.name,
    option_data.odds
  FROM inserted_bets ib
  CROSS JOIN LATERAL (
    VALUES 
      -- Eleições options
      (CASE WHEN ib.title = 'Eleições Presidenciais 2024' THEN 'Candidato A' END, CASE WHEN ib.title = 'Eleições Presidenciais 2024' THEN 2.50 END),
      (CASE WHEN ib.title = 'Eleições Presidenciais 2024' THEN 'Candidato B' END, CASE WHEN ib.title = 'Eleições Presidenciais 2024' THEN 1.80 END),
      (CASE WHEN ib.title = 'Eleições Presidenciais 2024' THEN 'Candidato C' END, CASE WHEN ib.title = 'Eleições Presidenciais 2024' THEN 3.20 END),
      -- Oscar options
      (CASE WHEN ib.title = 'Oscar 2024 - Melhor Filme' THEN 'Oppenheimer' END, CASE WHEN ib.title = 'Oscar 2024 - Melhor Filme' THEN 1.50 END),
      (CASE WHEN ib.title = 'Oscar 2024 - Melhor Filme' THEN 'Barbie' END, CASE WHEN ib.title = 'Oscar 2024 - Melhor Filme' THEN 2.80 END),
      (CASE WHEN ib.title = 'Oscar 2024 - Melhor Filme' THEN 'Killers of the Flower Moon' END, CASE WHEN ib.title = 'Oscar 2024 - Melhor Filme' THEN 4.00 END),
      -- Bitcoin options
      (CASE WHEN ib.title = 'Bitcoin chegará a $100.000?' THEN 'Sim' END, CASE WHEN ib.title = 'Bitcoin chegará a $100.000?' THEN 2.20 END),
      (CASE WHEN ib.title = 'Bitcoin chegará a $100.000?' THEN 'Não' END, CASE WHEN ib.title = 'Bitcoin chegará a $100.000?' THEN 1.70 END)
  ) AS option_data(name, odds)
  WHERE option_data.name IS NOT NULL
)
INSERT INTO public.bet_options (bet_id, name, odds)
SELECT bet_id, name, odds FROM bet_options_data;

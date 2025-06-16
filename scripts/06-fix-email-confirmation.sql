-- Confirmar todos os emails existentes (para desenvolvimento)
UPDATE auth.users 
SET email_confirmed_at = NOW()
WHERE email_confirmed_at IS NULL;

-- Verificar se funcionou
SELECT 
  id,
  email,
  email_confirmed_at,
  created_at
FROM auth.users;

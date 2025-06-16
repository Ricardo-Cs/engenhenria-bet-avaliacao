-- Script para criar usuários de teste após limpar o sistema
-- Execute este script APÓS o script de limpeza

-- Função para criar usuário de teste (temporária)
CREATE OR REPLACE FUNCTION create_test_user(
  user_email TEXT,
  user_password TEXT,
  user_name TEXT,
  user_role TEXT DEFAULT 'user'
)
RETURNS UUID AS $$
DECLARE
  new_user_id UUID;
BEGIN
  -- Gerar um UUID para o usuário
  new_user_id := gen_random_uuid();
  
  -- Inserir na tabela auth.users (simulando o que o Supabase faria)
  INSERT INTO auth.users (
    id,
    instance_id,
    email,
    encrypted_password,
    email_confirmed_at,
    created_at,
    updated_at,
    raw_user_meta_data,
    is_super_admin,
    role
  ) VALUES (
    new_user_id,
    '00000000-0000-0000-0000-000000000000',
    user_email,
    crypt(user_password, gen_salt('bf')), -- Hash da senha
    NOW(),
    NOW(),
    NOW(),
    json_build_object('full_name', user_name),
    false,
    'authenticated'
  );
  
  -- Inserir na tabela public.users
  INSERT INTO public.users (
    id,
    email,
    full_name,
    role,
    balance
  ) VALUES (
    new_user_id,
    user_email,
    user_name,
    user_role,
    CASE WHEN user_role = 'admin' THEN 5000.00 ELSE 1000.00 END
  );
  
  RETURN new_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Criar usuários de teste
SELECT create_test_user('user@teste.com', '123456', 'Usuário Teste', 'user');
SELECT create_test_user('admin@teste.com', '123456', 'Admin Teste', 'admin');

-- Verificar se os usuários foram criados
SELECT 
  u.email,
  u.full_name,
  u.role,
  u.balance,
  au.email_confirmed_at IS NOT NULL as email_confirmed
FROM public.users u
JOIN auth.users au ON u.id = au.id;

-- Remover a função temporária
DROP FUNCTION create_test_user(TEXT, TEXT, TEXT, TEXT);

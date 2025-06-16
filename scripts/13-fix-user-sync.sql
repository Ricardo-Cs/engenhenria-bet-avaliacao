-- Script para verificar e corrigir sincronização entre auth.users e public.users

-- 1. Verificar usuários em auth.users que não estão em public.users
SELECT 
  'Missing in public.users' as status,
  au.id,
  au.email,
  au.email_confirmed_at,
  au.created_at
FROM auth.users au
LEFT JOIN public.users pu ON au.id = pu.id
WHERE pu.id IS NULL;

-- 2. Verificar usuários em public.users que não estão em auth.users
SELECT 
  'Missing in auth.users' as status,
  pu.id,
  pu.email,
  pu.role,
  pu.balance,
  pu.created_at
FROM public.users pu
LEFT JOIN auth.users au ON pu.id = au.id
WHERE au.id IS NULL;

-- 3. Inserir usuários de auth.users que estão faltando em public.users
INSERT INTO public.users (id, email, full_name, role, balance)
SELECT 
  au.id,
  au.email,
  COALESCE(
    au.raw_user_meta_data->>'full_name',
    au.raw_user_meta_data->>'name',
    ''
  ) as full_name,
  'user' as role,
  1000.00 as balance
FROM auth.users au
LEFT JOIN public.users pu ON au.id = pu.id
WHERE pu.id IS NULL
  AND au.email IS NOT NULL;

-- 4. Verificar resultado
SELECT 
  'Final count' as status,
  (SELECT COUNT(*) FROM auth.users) as auth_users_count,
  (SELECT COUNT(*) FROM public.users) as public_users_count;

-- 5. Mostrar todos os usuários sincronizados
SELECT 
  pu.id,
  pu.email,
  pu.full_name,
  pu.role,
  pu.balance,
  au.email_confirmed_at IS NOT NULL as email_confirmed,
  pu.created_at
FROM public.users pu
JOIN auth.users au ON pu.id = au.id
ORDER BY pu.created_at DESC;

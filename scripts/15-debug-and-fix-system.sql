-- Script para diagnosticar e corrigir problemas do sistema

-- 1. Verificar usuários no sistema
SELECT 'AUTH USERS' as table_name, COUNT(*) as count FROM auth.users;
SELECT 'PUBLIC USERS' as table_name, COUNT(*) as count FROM public.users;

-- 2. Mostrar todos os usuários de auth.users
SELECT 
  'auth.users' as source,
  id,
  email,
  email_confirmed_at IS NOT NULL as confirmed,
  created_at
FROM auth.users
ORDER BY created_at DESC;

-- 3. Mostrar todos os usuários de public.users
SELECT 
  'public.users' as source,
  id,
  email,
  full_name,
  role,
  balance,
  created_at,
  updated_at
FROM public.users
ORDER BY updated_at DESC;

-- 4. Verificar discrepâncias entre auth.users e public.users
SELECT 
  'Missing in public.users' as issue,
  au.id,
  au.email,
  au.created_at
FROM auth.users au
LEFT JOIN public.users pu ON au.id = pu.id
WHERE pu.id IS NULL;

-- 5. Sincronizar usuários faltantes
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
  AND au.email IS NOT NULL
ON CONFLICT (id) DO NOTHING;

-- 6. Verificar apostas no sistema
SELECT 'BETS' as table_name, COUNT(*) as count FROM public.bets;
SELECT 'BET_OPTIONS' as table_name, COUNT(*) as count FROM public.bet_options;
SELECT 'USER_BETS' as table_name, COUNT(*) as count FROM public.user_bets;

-- 7. Mostrar estrutura das apostas
SELECT 
  b.id,
  b.title,
  b.status,
  b.category,
  COUNT(bo.id) as options_count,
  COUNT(ub.id) as user_bets_count
FROM public.bets b
LEFT JOIN public.bet_options bo ON b.id = bo.bet_id
LEFT JOIN public.user_bets ub ON b.id = ub.bet_id
GROUP BY b.id, b.title, b.status, b.category
ORDER BY b.created_at DESC;

-- 8. Verificar políticas RLS
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual
FROM pg_policies 
WHERE schemaname = 'public'
ORDER BY tablename, policyname;

-- 9. Testar acesso às tabelas (simular consulta de admin)
-- Verificar se as políticas RLS estão bloqueando o acesso
SET role postgres; -- Simular acesso de superusuário

SELECT 'Test access to users' as test;
SELECT COUNT(*) FROM public.users;

SELECT 'Test access to bets' as test;
SELECT COUNT(*) FROM public.bets;

SELECT 'Test access to user_bets' as test;
SELECT COUNT(*) FROM public.user_bets;

-- 10. Verificar triggers e funções
SELECT 
  trigger_name,
  event_manipulation,
  event_object_table,
  action_statement
FROM information_schema.triggers
WHERE event_object_schema = 'public'
ORDER BY event_object_table, trigger_name;

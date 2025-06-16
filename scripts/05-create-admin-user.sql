-- Este script deve ser executado APÓS você criar um usuário admin através da interface
-- Substitua 'seu-email-admin@exemplo.com' pelo email do usuário que deve ser admin

-- Para tornar um usuário existente admin:
UPDATE public.users 
SET role = 'admin' 
WHERE email = 'seu-email-admin@exemplo.com';

-- Verificar se funcionou:
SELECT id, email, full_name, role, balance 
FROM public.users 
WHERE role = 'admin';

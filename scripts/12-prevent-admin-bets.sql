-- Adicionar constraint para impedir que administradores façam apostas
-- Isso é uma camada extra de segurança no banco de dados

-- Função para verificar se o usuário é admin
CREATE OR REPLACE FUNCTION check_admin_bet_restriction()
RETURNS TRIGGER AS $$
DECLARE
  user_role TEXT;
BEGIN
  -- Buscar o papel do usuário
  SELECT role INTO user_role 
  FROM public.users 
  WHERE id = NEW.user_id;
  
  -- Se for admin, bloquear a aposta
  IF user_role = 'admin' THEN
    RAISE EXCEPTION 'Administradores não podem fazer apostas para evitar conflitos de interesse.';
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Criar trigger para verificar antes de inserir apostas
DROP TRIGGER IF EXISTS prevent_admin_bets ON public.user_bets;
CREATE TRIGGER prevent_admin_bets
  BEFORE INSERT ON public.user_bets
  FOR EACH ROW
  EXECUTE FUNCTION check_admin_bet_restriction();

-- Verificar se funcionou
SELECT 'Trigger criado com sucesso para prevenir apostas de administradores' as status;

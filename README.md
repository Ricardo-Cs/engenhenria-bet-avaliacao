# Sistema de Apostas Genérico - Backend

Este é um backend completo para um sistema de apostas genérico construído com Node.js, TypeScript, Express e PostgreSQL.

## Características

- **Autenticação JWT**: Sistema completo de login/registro
- **Roles de usuário**: Admin e usuário comum
- **Apostas genéricas**: Admins podem criar apostas sobre qualquer assunto
- **Sistema de odds**: Cada opção de aposta tem suas próprias odds
- **Gestão de saldo**: Usuários têm saldo para fazer apostas
- **Resolução de apostas**: Admins podem resolver apostas e distribuir prêmios
- **API RESTful**: Endpoints bem estruturados
- **Validação**: Validação completa de dados de entrada
- **Segurança**: Rate limiting, CORS, Helmet
- **TypeScript**: Tipagem completa

## Instalação

1. Clone o repositório
2. Instale as dependências:
\`\`\`bash
npm install
\`\`\`

3. Configure o banco de dados PostgreSQL
4. Copie `.env.example` para `.env` e configure as variáveis
5. Execute os scripts SQL para criar as tabelas:
\`\`\`bash
# Execute os scripts na ordem:
# 001-create-tables.sql
# 002-seed-data.sql
\`\`\`

6. Inicie o servidor:
\`\`\`bash
npm run dev
\`\`\`

## Endpoints da API

### Autenticação
- `POST /api/auth/register` - Registrar usuário
- `POST /api/auth/login` - Login
- `GET /api/auth/profile` - Perfil do usuário (autenticado)

### Apostas
- `GET /api/bets` - Listar apostas
- `GET /api/bets/:id` - Detalhes de uma aposta
- `POST /api/bets` - Criar aposta (admin)
- `POST /api/bets/place` - Fazer aposta (autenticado)
- `PUT /api/bets/:id/resolve` - Resolver aposta (admin)
- `GET /api/bets/user/my-bets` - Minhas apostas (autenticado)

## Estrutura do Banco

### Tabelas
- `users`: Usuários do sistema
- `bets`: Apostas criadas pelos admins
- `bet_options`: Opções de cada aposta
- `user_bets`: Apostas feitas pelos usuários

## Exemplos de Uso

### Registrar Admin
\`\`\`bash
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@test.com","password":"admin123","role":"admin"}'
\`\`\`

### Criar Aposta
\`\`\`bash
curl -X POST http://localhost:3000/api/bets \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "title": "Quem vai ganhar o BBB 2025?",
    "description": "Aposta sobre o vencedor do Big Brother Brasil 2025",
    "ends_at": "2025-04-30T23:59:59Z",
    "options": [
      {"option_text": "Participante A", "odds": 2.5},
      {"option_text": "Participante B", "odds": 3.0},
      {"option_text": "Participante C", "odds": 4.0}
    ]
  }'
\`\`\`

### Fazer Aposta
\`\`\`bash
curl -X POST http://localhost:3000/api/bets/place \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{"bet_option_id": 1, "amount": 100}'
\`\`\`

## Tecnologias Utilizadas

- Node.js
- TypeScript
- Express.js
- PostgreSQL
- JWT para autenticação
- bcryptjs para hash de senhas
- express-validator para validação
- express-rate-limit para rate limiting
- helmet para segurança
- cors para CORS

## Licença

MIT

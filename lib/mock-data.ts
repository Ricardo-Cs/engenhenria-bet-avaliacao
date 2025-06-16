// Dados mock para quando o Supabase não estiver configurado
export const mockBets = [
  {
    id: "1",
    title: "Eleições Presidenciais 2024",
    description: "Quem será o próximo presidente do Brasil?",
    category: "politica",
    status: "active",
    end_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
    bet_options: [
      { id: "1a", name: "Candidato A", odds: 2.5 },
      { id: "1b", name: "Candidato B", odds: 1.8 },
      { id: "1c", name: "Candidato C", odds: 3.2 },
    ],
    user_bets: [],
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: "2",
    title: "Oscar 2024 - Melhor Filme",
    description: "Qual filme ganhará o Oscar de Melhor Filme?",
    category: "entretenimento",
    status: "active",
    end_date: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toISOString(),
    bet_options: [
      { id: "2a", name: "Oppenheimer", odds: 1.5 },
      { id: "2b", name: "Barbie", odds: 2.8 },
      { id: "2c", name: "Killers of the Flower Moon", odds: 4.0 },
    ],
    user_bets: [],
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
]

export const mockUser = {
  id: "mock-user-id",
  email: "demo@example.com",
  full_name: "Usuário Demo",
  role: "user",
  balance: 1000,
}

export const mockAdminUser = {
  id: "mock-admin-id",
  email: "admin@example.com",
  full_name: "Admin Demo",
  role: "admin",
  balance: 5000,
}

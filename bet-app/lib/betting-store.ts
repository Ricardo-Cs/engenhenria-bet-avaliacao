"use client"

import { create } from "zustand"

interface BetOption {
  name: string
  odds: number
}

interface Bet {
  id: string
  title: string
  description: string
  category: string
  options: BetOption[]
  status: "active" | "closed"
  endDate: string
  winningOption?: string
  createdAt: string
}

interface UserBet {
  id: string
  betId: string
  option: string
  amount: number
  odds: number
  status: "active" | "won" | "lost"
  placedAt: string
}

interface BettingStore {
  bets: Bet[]
  userBets: UserBet[]
  createBet: (bet: Omit<Bet, "id" | "status" | "createdAt">) => void
  updateBet: (id: string, updates: Partial<Bet>) => void
  closeBet: (id: string, winningOption: string) => void
  placeBet: (userBet: Omit<UserBet, "id" | "status" | "placedAt">) => void
}

export const useBettingStore = create<BettingStore>((set, get) => ({
  bets: [
    {
      id: "1",
      title: "Eleições Presidenciais 2024",
      description: "Quem será o próximo presidente do Brasil?",
      category: "politica",
      options: [
        { name: "Candidato A", odds: 2.5 },
        { name: "Candidato B", odds: 1.8 },
        { name: "Candidato C", odds: 3.2 },
      ],
      status: "active",
      endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      createdAt: new Date().toISOString(),
    },
    {
      id: "2",
      title: "Oscar 2024 - Melhor Filme",
      description: "Qual filme ganhará o Oscar de Melhor Filme?",
      category: "entretenimento",
      options: [
        { name: "Oppenheimer", odds: 1.5 },
        { name: "Barbie", odds: 2.8 },
        { name: "Killers of the Flower Moon", odds: 4.0 },
      ],
      status: "active",
      endDate: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toISOString(),
      createdAt: new Date().toISOString(),
    },
    {
      id: "3",
      title: "Bitcoin chegará a $100.000?",
      description: "O Bitcoin atingirá $100.000 até o final do ano?",
      category: "economia",
      options: [
        { name: "Sim", odds: 2.2 },
        { name: "Não", odds: 1.7 },
      ],
      status: "active",
      endDate: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000).toISOString(),
      createdAt: new Date().toISOString(),
    },
  ],
  userBets: [
    {
      id: "1",
      betId: "1",
      option: "Candidato B",
      amount: 50,
      odds: 1.8,
      status: "active",
      placedAt: new Date().toISOString(),
    },
    {
      id: "2",
      betId: "2",
      option: "Oppenheimer",
      amount: 100,
      odds: 1.5,
      status: "active",
      placedAt: new Date().toISOString(),
    },
  ],

  createBet: (betData) => {
    const newBet: Bet = {
      ...betData,
      id: Math.random().toString(36).substr(2, 9),
      status: "active",
      createdAt: new Date().toISOString(),
    }
    set((state) => ({
      bets: [...state.bets, newBet],
    }))
  },

  updateBet: (id, updates) => {
    set((state) => ({
      bets: state.bets.map((bet) => (bet.id === id ? { ...bet, ...updates } : bet)),
    }))
  },

  closeBet: (id, winningOption) => {
    set((state) => {
      const updatedBets = state.bets.map((bet) =>
        bet.id === id ? { ...bet, status: "closed" as const, winningOption } : bet,
      )

      const updatedUserBets = state.userBets.map((userBet) => {
        if (userBet.betId === id) {
          return {
            ...userBet,
            status: userBet.option === winningOption ? ("won" as const) : ("lost" as const),
          }
        }
        return userBet
      })

      return {
        bets: updatedBets,
        userBets: updatedUserBets,
      }
    })
  },

  placeBet: (userBetData) => {
    const newUserBet: UserBet = {
      ...userBetData,
      id: Math.random().toString(36).substr(2, 9),
      status: "active",
      placedAt: new Date().toISOString(),
    }
    set((state) => ({
      userBets: [...state.userBets, newUserBet],
    }))
  },
}))

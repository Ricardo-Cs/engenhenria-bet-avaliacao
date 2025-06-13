export interface User {
  id: number
  email: string
  password: string
  role: "admin" | "user"
  balance: number
  created_at: Date
  updated_at: Date
}

export interface Bet {
  id: number
  title: string
  description: string
  admin_id: number
  status: "active" | "closed" | "resolved"
  created_at: Date
  ends_at: Date
  resolved_at?: Date
  winning_option_id?: number
}

export interface BetOption {
  id: number
  bet_id: number
  option_text: string
  odds: number
  created_at: Date
}

export interface UserBet {
  id: number
  user_id: number
  bet_option_id: number
  amount: number
  potential_payout: number
  status: "pending" | "won" | "lost"
  created_at: Date
}

export interface AuthRequest extends Request {
  user?: {
    id: number
    email: string
    role: string
  }
}

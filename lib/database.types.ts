export interface Database {
  public: {
    Tables: {
      users: {
        Row: {
          id: string
          email: string
          full_name: string | null
          role: "user" | "admin"
          balance: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          email: string
          full_name?: string | null
          role?: "user" | "admin"
          balance?: number
        }
        Update: {
          id?: string
          email?: string
          full_name?: string | null
          role?: "user" | "admin"
          balance?: number
        }
      }
      bets: {
        Row: {
          id: string
          title: string
          description: string
          category: string
          status: "active" | "closed" | "cancelled"
          end_date: string
          winning_option_id: string | null
          created_by: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          title: string
          description: string
          category: string
          end_date: string
          created_by?: string | null
        }
        Update: {
          title?: string
          description?: string
          category?: string
          status?: "active" | "closed" | "cancelled"
          end_date?: string
          winning_option_id?: string | null
        }
      }
      bet_options: {
        Row: {
          id: string
          bet_id: string
          name: string
          odds: number
          created_at: string
        }
        Insert: {
          bet_id: string
          name: string
          odds: number
        }
        Update: {
          name?: string
          odds?: number
        }
      }
      user_bets: {
        Row: {
          id: string
          user_id: string
          bet_id: string
          bet_option_id: string
          amount: number
          odds: number
          status: "active" | "won" | "lost" | "cancelled"
          potential_payout: number
          actual_payout: number
          placed_at: string
        }
        Insert: {
          user_id: string
          bet_id: string
          bet_option_id: string
          amount: number
          odds: number
          potential_payout: number
        }
        Update: {
          status?: "active" | "won" | "lost" | "cancelled"
          actual_payout?: number
        }
      }
    }
  }
}

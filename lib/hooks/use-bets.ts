"use client"

import { useState, useEffect, useCallback } from "react"

export interface Bet {
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
  bet_options: BetOption[]
  user_bets: UserBet[]
}

export interface BetOption {
  id: string
  bet_id: string
  name: string
  odds: number
  created_at: string
}

export interface UserBet {
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

export function useBets(status: "active" | "closed" = "active") {
  const [bets, setBets] = useState<Bet[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchBets = useCallback(async () => {
    console.log("Fetching bets with status:", status)

    try {
      setLoading(true)
      setError(null)

      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 15000) // 15s timeout

      const response = await fetch(`/api/bets?status=${status}`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
        signal: controller.signal,
      })

      clearTimeout(timeoutId)

      console.log("Bets API response status:", response.status)

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        console.error("Bets API error:", errorData)
        throw new Error(errorData.details || errorData.error || `HTTP ${response.status}`)
      }

      const data = await response.json()
      console.log("Bets data received:", data)

      setBets(data.bets || [])
    } catch (err: any) {
      console.error("Error in fetchBets:", err)

      if (err.name === "AbortError") {
        setError("Request timeout - please try again")
      } else {
        setError(err.message || "Failed to fetch bets")
      }
      setBets([])
    } finally {
      setLoading(false)
    }
  }, [status])

  const createBet = async (betData: {
    title: string
    description: string
    category: string
    endDate: string
    options: { name: string; odds: number }[]
    userId?: string
  }) => {
    console.log("Creating bet:", betData)

    try {
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 20000) // 20s timeout

      const response = await fetch("/api/bets", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(betData),
        signal: controller.signal,
      })

      clearTimeout(timeoutId)

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        console.error("Create bet error:", errorData)
        throw new Error(errorData.details || errorData.error || `HTTP ${response.status}`)
      }

      const data = await response.json()
      console.log("Bet created successfully:", data)

      await fetchBets() // Refresh the list
      return data.bet
    } catch (err: any) {
      console.error("Error in createBet:", err)

      if (err.name === "AbortError") {
        throw new Error("Request timeout - please try again")
      }
      throw new Error(err.message || "Failed to create bet")
    }
  }

  const closeBet = async (betId: string, winningOptionId: string) => {
    console.log("Closing bet:", betId, "winner:", winningOptionId)

    try {
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 20000) // 20s timeout

      const response = await fetch(`/api/bets/${betId}/close`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ winningOptionId }),
        signal: controller.signal,
      })

      clearTimeout(timeoutId)

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        console.error("Close bet error:", errorData)
        throw new Error(errorData.details || errorData.error || `HTTP ${response.status}`)
      }

      const data = await response.json()
      console.log("Bet closed successfully:", data)

      await fetchBets() // Refresh the list
      return data
    } catch (err: any) {
      console.error("Error in closeBet:", err)

      if (err.name === "AbortError") {
        throw new Error("Request timeout - please try again")
      }
      throw new Error(err.message || "Failed to close bet")
    }
  }

  useEffect(() => {
    fetchBets()
  }, [fetchBets])

  return {
    bets,
    loading,
    error,
    refetch: fetchBets,
    createBet,
    closeBet,
  }
}

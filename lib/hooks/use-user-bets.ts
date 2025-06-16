"use client"

import { useState, useEffect, useCallback } from "react"

export function useUserBets(userId: string | null) {
  const [userBets, setUserBets] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchUserBets = useCallback(async () => {
    // If userId is null, fetch all user bets (for admin)
    const isAdmin = userId === null

    console.log("Fetching user bets for:", isAdmin ? "admin (all users)" : userId)

    try {
      setLoading(true)
      setError(null)

      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 15000) // 15s timeout

      const url = isAdmin ? "/api/admin/user-bets" : `/api/user-bets?userId=${userId}`

      const response = await fetch(url, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
        signal: controller.signal,
      })

      clearTimeout(timeoutId)

      console.log("User bets API response status:", response.status)

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        console.error("User bets API error:", errorData)
        throw new Error(errorData.details || errorData.error || `HTTP ${response.status}`)
      }

      const data = await response.json()
      console.log("User bets data received:", data)

      setUserBets(data.userBets || [])
    } catch (err: any) {
      console.error("Error in fetchUserBets:", err)

      if (err.name === "AbortError") {
        setError("Request timeout - please try again")
      } else {
        setError(err.message || "Failed to fetch user bets")
      }
      setUserBets([])
    } finally {
      setLoading(false)
    }
  }, [userId])

  const placeBet = async (betData: {
    userId: string
    betId: string
    betOptionId: string
    amount: number
    odds: number
  }) => {
    console.log("Placing bet:", betData)

    try {
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 20000) // 20s timeout

      const response = await fetch("/api/user-bets", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(betData),
        signal: controller.signal,
      })

      clearTimeout(timeoutId)

      console.log("Place bet API response status:", response.status)

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        console.error("Place bet API error:", errorData)
        throw new Error(errorData.details || errorData.error || `HTTP ${response.status}`)
      }

      const data = await response.json()
      console.log("Bet placed successfully:", data)

      await fetchUserBets() // Refresh the list
      return data.userBet
    } catch (err: any) {
      console.error("Error in placeBet:", err)

      if (err.name === "AbortError") {
        throw new Error("Request timeout - please try again")
      }
      throw new Error(err.message || "Failed to place bet")
    }
  }

  useEffect(() => {
    fetchUserBets()
  }, [fetchUserBets])

  return {
    userBets,
    loading,
    error,
    refetch: fetchUserBets,
    placeBet,
  }
}

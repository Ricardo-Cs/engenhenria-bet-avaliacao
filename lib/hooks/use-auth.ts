"use client"

import { useState, useEffect, useCallback } from "react"
import { createSupabaseClient } from "@/lib/supabase"
import type { User } from "@supabase/supabase-js"

export function useAuth() {
  const [user, setUser] = useState<User | null>(null)
  const [userProfile, setUserProfile] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Get single instance of supabase client
  const supabase = createSupabaseClient()

  const fetchUserProfile = useCallback(async (userId: string) => {
    try {
      const response = await fetch(`/api/users/${userId}`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const data = await response.json()
      if (data.user) {
        setUserProfile(data.user)
      }
    } catch (error) {
      console.error("Error fetching user profile:", error)
      setError("Failed to fetch user profile")
    }
  }, [])

  useEffect(() => {
    if (!supabase) {
      setError("Supabase not configured")
      setLoading(false)
      return
    }

    let mounted = true

    // Get initial session
    const getInitialSession = async () => {
      try {
        const {
          data: { session },
          error,
        } = await supabase.auth.getSession()

        if (error) {
          console.error("Error getting session:", error)
          setError(error.message)
        }

        if (mounted) {
          setUser(session?.user ?? null)
          if (session?.user) {
            await fetchUserProfile(session.user.id)
          }
          setLoading(false)
        }
      } catch (error) {
        console.error("Error in getInitialSession:", error)
        if (mounted) {
          setError("Failed to get session")
          setLoading(false)
        }
      }
    }

    getInitialSession()

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (mounted) {
        setUser(session?.user ?? null)
        if (session?.user) {
          await fetchUserProfile(session.user.id)
        } else {
          setUserProfile(null)
        }
        setLoading(false)
      }
    })

    return () => {
      mounted = false
      subscription.unsubscribe()
    }
  }, [supabase, fetchUserProfile])

  const signIn = async (email: string, password: string) => {
    if (!supabase) {
      return { data: null, error: { message: "Supabase not configured" } }
    }

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })
      return { data, error }
    } catch (error) {
      console.error("Sign in error:", error)
      return { data: null, error: { message: "Sign in failed" } }
    }
  }

  const signUp = async (email: string, password: string, fullName: string) => {
    if (!supabase) {
      return { data: null, error: { message: "Supabase not configured" } }
    }

    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName,
          },
        },
      })
      return { data, error }
    } catch (error) {
      console.error("Sign up error:", error)
      return { data: null, error: { message: "Sign up failed" } }
    }
  }

  const signOut = async () => {
    if (!supabase) {
      return { error: { message: "Supabase not configured" } }
    }

    try {
      const { error } = await supabase.auth.signOut()
      if (!error) {
        setUser(null)
        setUserProfile(null)
      }
      return { error }
    } catch (error) {
      console.error("Sign out error:", error)
      return { error: { message: "Sign out failed" } }
    }
  }

  return {
    user,
    userProfile,
    loading,
    error,
    signIn,
    signUp,
    signOut,
    refetchProfile: () => user && fetchUserProfile(user.id),
  }
}

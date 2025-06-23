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
      console.log("Fetching user profile for:", userId)

      const response = await fetch(`/api/users/${userId}`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
        cache: "no-cache", // Ensure fresh data
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const data = await response.json()
      console.log("User profile fetched:", data.user)

      if (data.user) {
        setUserProfile(data.user)
      } else {
        console.warn("No user profile found, creating one...")
        // Try to create user profile if it doesn't exist
        await createUserProfile(userId)
      }
    } catch (error) {
      console.error("Error fetching user profile:", error)
      setError("Failed to fetch user profile")
    }
  }, [])

  const createUserProfile = async (userId: string) => {
    try {
      if (!supabase) return

      const { data: authUser } = await supabase.auth.getUser()
      if (!authUser.user) return

      console.log("Creating user profile for:", userId)

      const { data: newUser, error } = await supabase
        .from("users")
        .insert({
          id: userId,
          email: authUser.user.email || "",
          full_name: authUser.user.user_metadata?.full_name || authUser.user.user_metadata?.name || null,
          role: "user",
          balance: 1000.0,
        })
        .select()
        .single()

      if (error) {
        console.error("Error creating user profile:", error)
      } else {
        console.log("User profile created:", newUser)
        setUserProfile(newUser)
      }
    } catch (error) {
      console.error("Error in createUserProfile:", error)
    }
  }

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
      console.log("Auth state changed:", event, session?.user?.email)

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

      if (data.user && !error) {
        console.log("Sign in successful:", data.user.email)
      }

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

      if (data.user && !error) {
        console.log("Sign up successful:", data.user.email)
      }

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

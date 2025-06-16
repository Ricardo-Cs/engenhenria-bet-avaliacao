import { createClient, type SupabaseClient } from "@supabase/supabase-js"
import type { Database } from "./database.types"

// Singleton instances
let supabaseClient: SupabaseClient<Database> | null = null
let supabaseServerClient: SupabaseClient<Database> | null = null

// Função para criar cliente com validação em runtime
export const createSupabaseClient = (): SupabaseClient<Database> | null => {
  // Return existing client if already created
  if (supabaseClient) {
    return supabaseClient
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!supabaseUrl || !supabaseAnonKey) {
    return null
  }

  // Create and store the client
  supabaseClient = createClient<Database>(supabaseUrl, supabaseAnonKey, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
    },
  })

  return supabaseClient
}

// Cliente para uso no cliente (browser) - Singleton
export const supabase = typeof window !== "undefined" ? createSupabaseClient() : null

// Server-side client factory - Singleton
export const createServerClient = (): SupabaseClient<Database> | null => {
  // Return existing server client if already created
  if (supabaseServerClient) {
    return supabaseServerClient
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!supabaseUrl || !supabaseAnonKey) {
    return null
  }

  // Use service role key if available, otherwise use anon key
  const key = supabaseServiceKey || supabaseAnonKey

  // Create and store the server client
  supabaseServerClient = createClient<Database>(supabaseUrl, key, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  })

  return supabaseServerClient
}

// Função para verificar se o Supabase está configurado
export const isSupabaseConfigured = () => {
  return !!(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY)
}

// Reset clients (useful for testing)
export const resetSupabaseClients = () => {
  supabaseClient = null
  supabaseServerClient = null
}

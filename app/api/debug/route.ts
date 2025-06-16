import { NextResponse } from "next/server"
import { createServerClient, isSupabaseConfigured } from "@/lib/supabase"

export async function GET() {
  try {
    console.log("=== DEBUG API START ===")

    // Check environment
    const env = {
      NODE_ENV: process.env.NODE_ENV,
      NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL ? "SET" : "NOT SET",
      NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? "SET" : "NOT SET",
      SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY ? "SET" : "NOT SET",
    }

    console.log("Environment:", env)

    // Check Supabase config
    const isConfigured = isSupabaseConfigured()
    console.log("Supabase configured:", isConfigured)

    if (!isConfigured) {
      return NextResponse.json({
        status: "error",
        message: "Supabase not configured",
        environment: env,
      })
    }

    // Try to create client
    const supabase = createServerClient()
    console.log("Supabase client created:", !!supabase)

    if (!supabase) {
      return NextResponse.json({
        status: "error",
        message: "Failed to create Supabase client",
        environment: env,
      })
    }

    // Test database connection
    console.log("Testing database connection...")
    const { data: bets, error: betsError } = await supabase.from("bets").select("id, title, status").limit(5)

    console.log("Bets query result:", { bets, betsError })

    const { data: users, error: usersError } = await supabase.from("users").select("id, email, role").limit(5)

    console.log("Users query result:", { users, usersError })

    console.log("=== DEBUG API END ===")

    return NextResponse.json({
      status: "success",
      environment: env,
      supabaseConfigured: isConfigured,
      clientCreated: !!supabase,
      database: {
        bets: {
          count: bets?.length || 0,
          error: betsError?.message || null,
          data: bets || [],
        },
        users: {
          count: users?.length || 0,
          error: usersError?.message || null,
          data: users || [],
        },
      },
      timestamp: new Date().toISOString(),
    })
  } catch (error: any) {
    console.error("Debug API error:", error)
    return NextResponse.json(
      {
        status: "error",
        message: error.message,
        stack: error.stack,
        timestamp: new Date().toISOString(),
      },
      { status: 500 },
    )
  }
}

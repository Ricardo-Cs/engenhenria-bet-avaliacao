import { NextResponse } from "next/server"
import { createServerClient, isSupabaseConfigured } from "@/lib/supabase"

export async function GET() {
  try {
    console.log("=== FULL SYSTEM DEBUG START ===")

    if (!isSupabaseConfigured()) {
      return NextResponse.json({ error: "Supabase not configured" }, { status: 503 })
    }

    const supabase = createServerClient()
    if (!supabase) {
      return NextResponse.json({ error: "Failed to initialize Supabase client" }, { status: 500 })
    }

    const debug = {
      timestamp: new Date().toISOString(),
      environment: {
        NODE_ENV: process.env.NODE_ENV,
        SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL ? "SET" : "NOT SET",
        SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? "SET" : "NOT SET",
        SUPABASE_SERVICE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY ? "SET" : "NOT SET",
      },
    }

    // Test 1: Auth users
    console.log("Testing auth users...")
    try {
      const { data: authUsers, error: authError } = await supabase.auth.admin.listUsers()
      debug.authUsers = {
        count: authUsers?.users?.length || 0,
        users:
          authUsers?.users?.map((u) => ({
            id: u.id,
            email: u.email,
            confirmed: !!u.email_confirmed_at,
            created: u.created_at,
            metadata: u.user_metadata,
          })) || [],
        error: authError?.message || null,
      }
    } catch (error: any) {
      debug.authUsers = { error: error.message, count: 0, users: [] }
    }

    // Test 2: Public users
    console.log("Testing public users...")
    try {
      const { data: publicUsers, error: publicError } = await supabase
        .from("users")
        .select("*")
        .order("created_at", { ascending: false })

      debug.publicUsers = {
        count: publicUsers?.length || 0,
        users: publicUsers || [],
        error: publicError?.message || null,
      }
    } catch (error: any) {
      debug.publicUsers = { error: error.message, count: 0, users: [] }
    }

    // Test 3: Bets
    console.log("Testing bets...")
    try {
      const { data: bets, error: betsError } = await supabase
        .from("bets")
        .select(`
          *,
          bet_options (*)
        `)
        .order("created_at", { ascending: false })

      debug.bets = {
        count: bets?.length || 0,
        bets: bets || [],
        error: betsError?.message || null,
      }
    } catch (error: any) {
      debug.bets = { error: error.message, count: 0, bets: [] }
    }

    // Test 4: User bets
    console.log("Testing user bets...")
    try {
      const { data: userBets, error: userBetsError } = await supabase
        .from("user_bets")
        .select(`
          *,
          users (email, full_name),
          bets (title),
          bet_options (name)
        `)
        .order("placed_at", { ascending: false })

      debug.userBets = {
        count: userBets?.length || 0,
        userBets: userBets || [],
        error: userBetsError?.message || null,
      }
    } catch (error: any) {
      debug.userBets = { error: error.message, count: 0, userBets: [] }
    }

    // Test 5: RLS Policies
    console.log("Testing RLS policies...")
    try {
      const { data: policies, error: policiesError } = await supabase.rpc("get_policies").select()

      debug.policies = {
        error: policiesError?.message || "RPC not available - this is normal",
        note: "RLS policies are active but cannot be queried via API",
      }
    } catch (error: any) {
      debug.policies = {
        error: "Cannot query policies via API - this is normal",
        note: "RLS policies are configured at database level",
      }
    }

    // Test 6: Check discrepancies
    const authUserIds = new Set(debug.authUsers.users.map((u) => u.id))
    const publicUserIds = new Set(debug.publicUsers.users.map((u) => u.id))

    debug.discrepancies = {
      authUsersNotInPublic: debug.authUsers.users.filter((u) => !publicUserIds.has(u.id)),
      publicUsersNotInAuth: debug.publicUsers.users.filter((u) => !authUserIds.has(u.id)),
      totalAuthUsers: debug.authUsers.count,
      totalPublicUsers: debug.publicUsers.count,
      syncNeeded: debug.authUsers.count !== debug.publicUsers.count,
    }

    console.log("=== FULL SYSTEM DEBUG END ===")

    return NextResponse.json({
      status: "success",
      debug,
      summary: {
        authUsers: debug.authUsers.count,
        publicUsers: debug.publicUsers.count,
        bets: debug.bets.count,
        userBets: debug.userBets.count,
        syncNeeded: debug.discrepancies.syncNeeded,
        issues: [
          ...(debug.authUsers.error ? [`Auth users: ${debug.authUsers.error}`] : []),
          ...(debug.publicUsers.error ? [`Public users: ${debug.publicUsers.error}`] : []),
          ...(debug.bets.error ? [`Bets: ${debug.bets.error}`] : []),
          ...(debug.userBets.error ? [`User bets: ${debug.userBets.error}`] : []),
        ],
      },
    })
  } catch (error: any) {
    console.error("Full system debug error:", error)
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

import { NextResponse } from "next/server"
import { createServerClient, isSupabaseConfigured } from "@/lib/supabase"

export async function GET() {
  try {
    console.log("=== DEBUG USERS START ===")

    if (!isSupabaseConfigured()) {
      return NextResponse.json({ error: "Supabase not configured" }, { status: 503 })
    }

    const supabase = createServerClient()
    if (!supabase) {
      return NextResponse.json({ error: "Failed to initialize Supabase client" }, { status: 500 })
    }

    // Check auth.users
    console.log("Checking auth.users...")
    const { data: authUsers, error: authError } = await supabase.auth.admin.listUsers()

    if (authError) {
      console.error("Auth users error:", authError)
    } else {
      console.log("Auth users found:", authUsers.users.length)
      authUsers.users.forEach((user) => {
        console.log(`- ${user.email} (${user.id}) - confirmed: ${!!user.email_confirmed_at}`)
      })
    }

    // Check public.users
    console.log("Checking public.users...")
    const { data: publicUsers, error: publicError } = await supabase.from("users").select("*")

    if (publicError) {
      console.error("Public users error:", publicError)
    } else {
      console.log("Public users found:", publicUsers?.length || 0)
      publicUsers?.forEach((user) => {
        console.log(`- ${user.email} (${user.id}) - role: ${user.role}, balance: ${user.balance}`)
      })
    }

    // Find discrepancies
    const authUserIds = new Set(authUsers?.users.map((u) => u.id) || [])
    const publicUserIds = new Set(publicUsers?.map((u) => u.id) || [])

    const missingInPublic = authUsers?.users.filter((u) => !publicUserIds.has(u.id)) || []
    const missingInAuth = publicUsers?.filter((u) => !authUserIds.has(u.id)) || []

    console.log("=== DEBUG USERS END ===")

    return NextResponse.json({
      status: "success",
      authUsers: {
        count: authUsers?.users.length || 0,
        users:
          authUsers?.users.map((u) => ({
            id: u.id,
            email: u.email,
            confirmed: !!u.email_confirmed_at,
            metadata: u.user_metadata,
          })) || [],
        error: authError?.message || null,
      },
      publicUsers: {
        count: publicUsers?.length || 0,
        users: publicUsers || [],
        error: publicError?.message || null,
      },
      discrepancies: {
        missingInPublic: missingInPublic.map((u) => ({
          id: u.id,
          email: u.email,
          metadata: u.user_metadata,
        })),
        missingInAuth: missingInAuth.map((u) => ({
          id: u.id,
          email: u.email,
        })),
      },
      timestamp: new Date().toISOString(),
    })
  } catch (error: any) {
    console.error("Debug users error:", error)
    return NextResponse.json(
      {
        status: "error",
        message: error.message,
        timestamp: new Date().toISOString(),
      },
      { status: 500 },
    )
  }
}

import { NextResponse } from "next/server"
import { createServerClient, isSupabaseConfigured } from "@/lib/supabase"

export async function POST() {
  try {
    if (!isSupabaseConfigured()) {
      return NextResponse.json({ error: "Supabase not configured" }, { status: 503 })
    }

    const supabase = createServerClient()
    if (!supabase) {
      return NextResponse.json({ error: "Failed to initialize Supabase client" }, { status: 500 })
    }

    // Get all users from auth.users
    const { data: authUsers, error: authError } = await supabase.auth.admin.listUsers()

    if (authError) {
      console.error("Error listing auth users:", authError)
      return NextResponse.json({ error: "Failed to list users", details: authError.message }, { status: 500 })
    }

    // Delete all users
    const deletePromises = authUsers.users.map(async (user) => {
      const { error } = await supabase.auth.admin.deleteUser(user.id)
      if (error) {
        console.error(`Error deleting user ${user.email}:`, error)
        return { email: user.email, success: false, error: error.message }
      }
      return { email: user.email, success: true }
    })

    const results = await Promise.all(deletePromises)

    return NextResponse.json({
      message: "User cleanup completed",
      results,
      totalUsers: authUsers.users.length,
      successful: results.filter((r) => r.success).length,
      failed: results.filter((r) => !r.success).length,
    })
  } catch (error: any) {
    console.error("Error in auth cleanup:", error)
    return NextResponse.json({ error: "Internal server error", details: error.message }, { status: 500 })
  }
}

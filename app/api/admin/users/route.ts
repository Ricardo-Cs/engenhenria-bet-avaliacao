import { type NextRequest, NextResponse } from "next/server"
import { createServerClient, isSupabaseConfigured } from "@/lib/supabase"

export async function GET(request: NextRequest) {
  console.log("=== GET /api/admin/users START ===")

  try {
    if (!isSupabaseConfigured()) {
      return NextResponse.json({ error: "Supabase not configured" }, { status: 503 })
    }

    const supabase = createServerClient()
    if (!supabase) {
      return NextResponse.json({ error: "Failed to initialize Supabase client" }, { status: 500 })
    }

    console.log("Fetching all users for admin")

    const { data: users, error } = await supabase.from("users").select("*").order("created_at", { ascending: false })

    if (error) {
      console.error("Error fetching users:", error)
      return NextResponse.json(
        {
          error: "Failed to fetch users",
          details: error.message,
        },
        { status: 500 },
      )
    }

    console.log("Users fetched:", users?.length || 0)

    return NextResponse.json({
      users: users || [],
      count: users?.length || 0,
      status: "success",
    })
  } catch (error: any) {
    console.error("Unexpected error in GET /api/admin/users:", error)
    return NextResponse.json(
      {
        error: "Internal server error",
        details: error.message,
      },
      { status: 500 },
    )
  } finally {
    console.log("=== GET /api/admin/users END ===")
  }
}

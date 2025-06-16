import { type NextRequest, NextResponse } from "next/server"
import { createServerClient, isSupabaseConfigured } from "@/lib/supabase"

export async function GET(request: NextRequest) {
  console.log("=== GET /api/admin/user-bets START ===")

  try {
    if (!isSupabaseConfigured()) {
      return NextResponse.json({ error: "Supabase not configured" }, { status: 503 })
    }

    const supabase = createServerClient()
    if (!supabase) {
      return NextResponse.json({ error: "Failed to initialize Supabase client" }, { status: 500 })
    }

    console.log("Fetching all user bets for admin")

    const { data: userBets, error } = await supabase
      .from("user_bets")
      .select(`
        *,
        users (
          id,
          email,
          full_name
        ),
        bets (
          id,
          title,
          description,
          category,
          status
        ),
        bet_options (
          id,
          name
        )
      `)
      .order("placed_at", { ascending: false })

    if (error) {
      console.error("Error fetching admin user bets:", error)
      return NextResponse.json(
        {
          error: "Failed to fetch user bets",
          details: error.message,
        },
        { status: 500 },
      )
    }

    console.log("Admin user bets fetched:", userBets?.length || 0)

    return NextResponse.json({
      userBets: userBets || [],
      count: userBets?.length || 0,
      status: "success",
    })
  } catch (error: any) {
    console.error("Unexpected error in GET /api/admin/user-bets:", error)
    return NextResponse.json(
      {
        error: "Internal server error",
        details: error.message,
      },
      { status: 500 },
    )
  } finally {
    console.log("=== GET /api/admin/user-bets END ===")
  }
}

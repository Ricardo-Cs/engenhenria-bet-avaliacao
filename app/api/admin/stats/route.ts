import { type NextRequest, NextResponse } from "next/server"
import { createServerClient, isSupabaseConfigured } from "@/lib/supabase"

export async function GET(request: NextRequest) {
  // Verificar configuração do Supabase
  if (!isSupabaseConfigured()) {
    return NextResponse.json(
      {
        error: "Supabase not configured",
        message: "Please configure NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY environment variables",
      },
      { status: 503 },
    )
  }

  const supabase = createServerClient()

  if (!supabase) {
    return NextResponse.json({ error: "Failed to initialize Supabase client" }, { status: 500 })
  }

  try {
    // Get total bets count
    const { count: totalBets } = await supabase.from("bets").select("*", { count: "exact", head: true })

    // Get active bets count
    const { count: activeBets } = await supabase
      .from("bets")
      .select("*", { count: "exact", head: true })
      .eq("status", "active")

    // Get total user bets count
    const { count: totalUserBets } = await supabase.from("user_bets").select("*", { count: "exact", head: true })

    // Get total volume
    const { data: volumeData } = await supabase.from("user_bets").select("amount")

    const totalVolume = volumeData?.reduce((sum, bet) => sum + bet.amount, 0) || 0

    // Get recent activity
    const { data: recentBets } = await supabase
      .from("user_bets")
      .select(`
        *,
        users (full_name, email),
        bets (title),
        bet_options (name)
      `)
      .order("placed_at", { ascending: false })
      .limit(10)

    return NextResponse.json({
      stats: {
        totalBets: totalBets || 0,
        activeBets: activeBets || 0,
        totalUserBets: totalUserBets || 0,
        totalVolume,
      },
      recentActivity: recentBets || [],
    })
  } catch (error) {
    console.error("Error fetching admin stats:", error)
    return NextResponse.json({ error: "Failed to fetch stats" }, { status: 500 })
  }
}

import { type NextRequest, NextResponse } from "next/server"
import { createServerClient, isSupabaseConfigured } from "@/lib/supabase"

export async function GET(request: NextRequest) {
  console.log("=== GET /api/user-bets START ===")

  try {
    if (!isSupabaseConfigured()) {
      return NextResponse.json({ error: "Supabase not configured" }, { status: 503 })
    }

    const supabase = createServerClient()
    if (!supabase) {
      return NextResponse.json({ error: "Failed to initialize Supabase client" }, { status: 500 })
    }

    const { searchParams } = new URL(request.url)
    const userId = searchParams.get("userId")

    if (!userId) {
      return NextResponse.json({ error: "User ID is required" }, { status: 400 })
    }

    console.log("Fetching user bets for user:", userId)

    const { data: userBets, error } = await supabase
      .from("user_bets")
      .select(`
        *,
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
      .eq("user_id", userId)
      .order("placed_at", { ascending: false })

    if (error) {
      console.error("Error fetching user bets:", error)
      return NextResponse.json(
        {
          error: "Failed to fetch user bets",
          details: error.message,
        },
        { status: 500 },
      )
    }

    console.log("User bets fetched:", userBets?.length || 0)

    return NextResponse.json({
      userBets: userBets || [],
      count: userBets?.length || 0,
      status: "success",
    })
  } catch (error: any) {
    console.error("Unexpected error in GET /api/user-bets:", error)
    return NextResponse.json(
      {
        error: "Internal server error",
        details: error.message,
      },
      { status: 500 },
    )
  } finally {
    console.log("=== GET /api/user-bets END ===")
  }
}

export async function POST(request: NextRequest) {
  console.log("=== POST /api/user-bets START ===")

  try {
    if (!isSupabaseConfigured()) {
      return NextResponse.json({ error: "Supabase not configured" }, { status: 503 })
    }

    const supabase = createServerClient()
    if (!supabase) {
      return NextResponse.json({ error: "Failed to initialize Supabase client" }, { status: 500 })
    }

    const body = await request.json()
    console.log("Place bet request:", body)

    const { userId, betId, betOptionId, amount, odds } = body

    // Validate required fields
    if (!userId || !betId || !betOptionId || !amount || !odds) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    // Validate amount
    const betAmount = Number(amount)
    if (isNaN(betAmount) || betAmount <= 0) {
      return NextResponse.json({ error: "Invalid bet amount" }, { status: 400 })
    }

    // Check user balance
    const { data: user, error: userError } = await supabase.from("users").select("balance").eq("id", userId).single()

    if (userError) {
      console.error("Error fetching user:", userError)
      return NextResponse.json(
        {
          error: "Failed to fetch user data",
          details: userError.message,
        },
        { status: 500 },
      )
    }

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    if (user.balance < betAmount) {
      return NextResponse.json({ error: "Insufficient balance" }, { status: 400 })
    }

    // Calculate potential payout
    const potentialPayout = betAmount * Number(odds)

    // Start transaction - place bet
    const { data: userBet, error: betError } = await supabase
      .from("user_bets")
      .insert({
        user_id: userId,
        bet_id: betId,
        bet_option_id: betOptionId,
        amount: betAmount,
        odds: Number(odds),
        potential_payout: potentialPayout,
      })
      .select(`
        *,
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
      .single()

    if (betError) {
      console.error("Error placing bet:", betError)
      return NextResponse.json(
        {
          error: "Failed to place bet",
          details: betError.message,
        },
        { status: 500 },
      )
    }

    // Update user balance
    const { error: balanceError } = await supabase
      .from("users")
      .update({ balance: user.balance - betAmount })
      .eq("id", userId)

    if (balanceError) {
      console.error("Error updating balance:", balanceError)
      // Try to rollback the bet
      await supabase.from("user_bets").delete().eq("id", userBet.id)

      return NextResponse.json(
        {
          error: "Failed to update balance",
          details: balanceError.message,
        },
        { status: 500 },
      )
    }

    console.log("Bet placed successfully:", userBet.id)

    return NextResponse.json({
      userBet,
      success: true,
      message: "Bet placed successfully",
    })
  } catch (error: any) {
    console.error("Unexpected error in POST /api/user-bets:", error)
    return NextResponse.json(
      {
        error: "Internal server error",
        details: error.message,
      },
      { status: 500 },
    )
  } finally {
    console.log("=== POST /api/user-bets END ===")
  }
}

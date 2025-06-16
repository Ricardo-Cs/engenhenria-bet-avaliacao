import { type NextRequest, NextResponse } from "next/server"
import { createServerClient, isSupabaseConfigured } from "@/lib/supabase"

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  console.log("=== POST /api/bets/[id]/close START ===")

  try {
    if (!isSupabaseConfigured()) {
      return NextResponse.json({ error: "Supabase not configured" }, { status: 503 })
    }

    const supabase = createServerClient()
    if (!supabase) {
      return NextResponse.json({ error: "Failed to initialize Supabase client" }, { status: 500 })
    }

    const body = await request.json()
    const { winningOptionId } = body
    const betId = params.id

    console.log("Closing bet:", betId, "winner:", winningOptionId)

    // Validate inputs
    if (!betId || !winningOptionId) {
      return NextResponse.json({ error: "Missing bet ID or winning option ID" }, { status: 400 })
    }

    // Check if bet exists and is active
    const { data: bet, error: betError } = await supabase
      .from("bets")
      .select("id, status, title")
      .eq("id", betId)
      .single()

    if (betError || !bet) {
      console.error("Bet not found:", betError)
      return NextResponse.json({ error: "Bet not found" }, { status: 404 })
    }

    if (bet.status !== "active") {
      return NextResponse.json({ error: "Bet is not active" }, { status: 400 })
    }

    // Check if winning option exists for this bet
    const { data: option, error: optionError } = await supabase
      .from("bet_options")
      .select("id, name")
      .eq("id", winningOptionId)
      .eq("bet_id", betId)
      .single()

    if (optionError || !option) {
      console.error("Invalid winning option:", optionError)
      return NextResponse.json({ error: "Invalid winning option for this bet" }, { status: 400 })
    }

    console.log("Closing bet with winner:", option.name)

    // Use the FIXED stored procedure to close the bet
    const { data: result, error: closeError } = await supabase.rpc("close_bet_fixed", {
      bet_id_param: betId,
      winning_option_id_param: winningOptionId,
    })

    if (closeError) {
      console.error("Error calling close_bet_fixed function:", closeError)

      // Fallback to manual closure if the function fails
      console.log("Attempting manual bet closure...")

      try {
        // Manual bet closure process
        // 1. Update bet status
        const { error: updateBetError } = await supabase
          .from("bets")
          .update({
            status: "closed",
            winning_option_id: winningOptionId,
            updated_at: new Date().toISOString(),
          })
          .eq("id", betId)

        if (updateBetError) throw updateBetError

        // 2. Get all user bets for this bet
        const { data: userBets, error: userBetsError } = await supabase
          .from("user_bets")
          .select("*")
          .eq("bet_id", betId)
          .eq("status", "active")

        if (userBetsError) throw userBetsError

        console.log("Found user bets to process:", userBets?.length || 0)

        // 3. Process each user bet
        for (const userBet of userBets || []) {
          const isWinner = userBet.bet_option_id === winningOptionId
          const actualPayout = isWinner ? userBet.amount * userBet.odds : 0
          const newStatus = isWinner ? "won" : "lost"

          // Update user bet
          const { error: updateUserBetError } = await supabase
            .from("user_bets")
            .update({
              status: newStatus,
              actual_payout: actualPayout,
            })
            .eq("id", userBet.id)

          if (updateUserBetError) {
            console.error("Error updating user bet:", updateUserBetError)
            continue
          }

          // If winner, update user balance
          if (isWinner && actualPayout > 0) {
            const { data: user, error: getUserError } = await supabase
              .from("users")
              .select("balance")
              .eq("id", userBet.user_id)
              .single()

            if (!getUserError && user) {
              const { error: updateBalanceError } = await supabase
                .from("users")
                .update({
                  balance: user.balance + actualPayout,
                  updated_at: new Date().toISOString(),
                })
                .eq("id", userBet.user_id)

              if (updateBalanceError) {
                console.error("Error updating user balance:", updateBalanceError)
              } else {
                console.log(`Paid ${actualPayout} to user ${userBet.user_id}`)
              }
            }
          }
        }

        // Calculate total payout for response
        const totalPayout = (userBets || [])
          .filter((ub) => ub.bet_option_id === winningOptionId)
          .reduce((sum, ub) => sum + ub.amount * ub.odds, 0)

        return NextResponse.json({
          success: true,
          message: `Bet "${bet.title}" closed successfully. Winner: ${option.name}`,
          result: {
            success: true,
            total_payout: totalPayout,
            winning_bets: (userBets || []).filter((ub) => ub.bet_option_id === winningOptionId).length,
            losing_bets: (userBets || []).filter((ub) => ub.bet_option_id !== winningOptionId).length,
            method: "manual_fallback",
          },
        })
      } catch (manualError: any) {
        console.error("Manual closure also failed:", manualError)
        return NextResponse.json(
          {
            error: "Failed to close bet",
            details: `Function error: ${closeError.message}, Manual error: ${manualError.message}`,
          },
          { status: 500 },
        )
      }
    }

    console.log("Close bet result:", result)

    // Check if the function returned success
    if (result && typeof result === "object" && result.success === false) {
      return NextResponse.json(
        {
          error: result.error || "Failed to close bet",
          details: result.error,
        },
        { status: 400 },
      )
    }

    return NextResponse.json({
      success: true,
      message: `Bet "${bet.title}" closed successfully. Winner: ${option.name}`,
      result,
    })
  } catch (error: any) {
    console.error("Unexpected error in POST /api/bets/[id]/close:", error)
    return NextResponse.json(
      {
        error: "Internal server error",
        details: error.message,
      },
      { status: 500 },
    )
  } finally {
    console.log("=== POST /api/bets/[id]/close END ===")
  }
}

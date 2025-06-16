import { type NextRequest, NextResponse } from "next/server"
import { createServerClient, isSupabaseConfigured } from "@/lib/supabase"

export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  console.log("=== PATCH /api/bets/[id] START ===")

  try {
    if (!isSupabaseConfigured()) {
      return NextResponse.json({ error: "Supabase not configured" }, { status: 503 })
    }

    const supabase = createServerClient()
    if (!supabase) {
      return NextResponse.json({ error: "Failed to initialize Supabase client" }, { status: 500 })
    }

    const body = await request.json()
    const { title, description, category, endDate, options } = body
    const betId = params.id

    console.log("Updating bet:", betId, body)

    // Update the bet
    const { data: updatedBet, error: betError } = await supabase
      .from("bets")
      .update({
        title,
        description,
        category,
        end_date: endDate,
        updated_at: new Date().toISOString(),
      })
      .eq("id", betId)
      .select()
      .single()

    if (betError) {
      console.error("Error updating bet:", betError)
      return NextResponse.json({ error: "Failed to update bet", details: betError.message }, { status: 500 })
    }

    // Update bet options if provided
    if (options && Array.isArray(options)) {
      // Delete existing options
      const { error: deleteError } = await supabase.from("bet_options").delete().eq("bet_id", betId)

      if (deleteError) {
        console.error("Error deleting old options:", deleteError)
        return NextResponse.json({ error: "Failed to update options", details: deleteError.message }, { status: 500 })
      }

      // Insert new options
      const newOptions = options.map((option: any) => ({
        bet_id: betId,
        name: option.name,
        odds: Number(option.odds),
      }))

      const { data: createdOptions, error: optionsError } = await supabase
        .from("bet_options")
        .insert(newOptions)
        .select()

      if (optionsError) {
        console.error("Error creating new options:", optionsError)
        return NextResponse.json(
          { error: "Failed to create new options", details: optionsError.message },
          { status: 500 },
        )
      }

      console.log("Options updated:", createdOptions?.length)
    }

    console.log("Bet updated successfully")

    return NextResponse.json({
      bet: updatedBet,
      success: true,
      message: "Bet updated successfully",
    })
  } catch (error: any) {
    console.error("Unexpected error in PATCH /api/bets/[id]:", error)
    return NextResponse.json({ error: "Internal server error", details: error.message }, { status: 500 })
  } finally {
    console.log("=== PATCH /api/bets/[id] END ===")
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  console.log("=== DELETE /api/bets/[id] START ===")

  try {
    if (!isSupabaseConfigured()) {
      return NextResponse.json({ error: "Supabase not configured" }, { status: 503 })
    }

    const supabase = createServerClient()
    if (!supabase) {
      return NextResponse.json({ error: "Failed to initialize Supabase client" }, { status: 500 })
    }

    const betId = params.id

    console.log("Deleting bet:", betId)

    // Check if bet has user bets
    const { data: userBets, error: userBetsError } = await supabase
      .from("user_bets")
      .select("id")
      .eq("bet_id", betId)
      .limit(1)

    if (userBetsError) {
      console.error("Error checking user bets:", userBetsError)
      return NextResponse.json({ error: "Failed to check user bets", details: userBetsError.message }, { status: 500 })
    }

    if (userBets && userBets.length > 0) {
      return NextResponse.json({ error: "Cannot delete bet with existing user bets" }, { status: 400 })
    }

    // Delete the bet (cascade will handle options)
    const { error: deleteError } = await supabase.from("bets").delete().eq("id", betId)

    if (deleteError) {
      console.error("Error deleting bet:", deleteError)
      return NextResponse.json({ error: "Failed to delete bet", details: deleteError.message }, { status: 500 })
    }

    console.log("Bet deleted successfully")

    return NextResponse.json({
      success: true,
      message: "Bet deleted successfully",
    })
  } catch (error: any) {
    console.error("Unexpected error in DELETE /api/bets/[id]:", error)
    return NextResponse.json({ error: "Internal server error", details: error.message }, { status: 500 })
  } finally {
    console.log("=== DELETE /api/bets/[id] END ===")
  }
}

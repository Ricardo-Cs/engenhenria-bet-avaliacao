import { type NextRequest, NextResponse } from "next/server"
import { createServerClient, isSupabaseConfigured } from "@/lib/supabase"

export async function GET(request: NextRequest) {
  console.log("=== GET /api/bets START ===")

  try {
    if (!isSupabaseConfigured()) {
      console.log("Supabase not configured")
      return NextResponse.json({ error: "Supabase not configured" }, { status: 503 })
    }

    const supabase = createServerClient()
    if (!supabase) {
      console.log("Failed to create Supabase client")
      return NextResponse.json({ error: "Failed to initialize Supabase client" }, { status: 500 })
    }

    const { searchParams } = new URL(request.url)
    const status = searchParams.get("status") || "active"

    console.log("Fetching bets with status:", status)

    // Simple query first - just bets
    const { data: bets, error: betsError } = await supabase
      .from("bets")
      .select("*")
      .eq("status", status)
      .order("created_at", { ascending: false })

    if (betsError) {
      console.error("Error fetching bets:", betsError)
      return NextResponse.json(
        {
          error: "Failed to fetch bets",
          details: betsError.message,
        },
        { status: 500 },
      )
    }

    console.log("Bets fetched:", bets?.length || 0)

    // Fetch bet options separately
    const betIds = bets?.map((bet) => bet.id) || []
    let betOptions: any[] = []

    if (betIds.length > 0) {
      const { data: options, error: optionsError } = await supabase.from("bet_options").select("*").in("bet_id", betIds)

      if (optionsError) {
        console.error("Error fetching bet options:", optionsError)
      } else {
        betOptions = options || []
        console.log("Bet options fetched:", betOptions.length)
      }
    }

    // Combine bets with their options
    const betsWithOptions = (bets || []).map((bet) => ({
      ...bet,
      bet_options: betOptions.filter((option) => option.bet_id === bet.id),
      user_bets: [], // Empty for now
    }))

    console.log("Final bets with options:", betsWithOptions.length)

    return NextResponse.json({
      bets: betsWithOptions,
      count: betsWithOptions.length,
      status: "success",
    })
  } catch (error: any) {
    console.error("Unexpected error in GET /api/bets:", error)
    return NextResponse.json(
      {
        error: "Internal server error",
        details: error.message,
      },
      { status: 500 },
    )
  } finally {
    console.log("=== GET /api/bets END ===")
  }
}

export async function POST(request: NextRequest) {
  console.log("=== POST /api/bets START ===")

  try {
    if (!isSupabaseConfigured()) {
      return NextResponse.json({ error: "Supabase not configured" }, { status: 503 })
    }

    const supabase = createServerClient()
    if (!supabase) {
      return NextResponse.json({ error: "Failed to initialize Supabase client" }, { status: 500 })
    }

    const body = await request.json()
    console.log("Request body:", body)

    const { title, description, category, endDate, options, userId } = body

    if (!title || !description || !category || !endDate || !options || !Array.isArray(options)) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    // Create the bet
    const { data: bet, error: betError } = await supabase
      .from("bets")
      .insert({
        title,
        description,
        category,
        end_date: endDate,
        created_by: userId || null,
      })
      .select()
      .single()

    if (betError) {
      console.error("Error creating bet:", betError)
      return NextResponse.json({ error: "Failed to create bet", details: betError.message }, { status: 500 })
    }

    console.log("Bet created:", bet)

    // Create bet options
    const betOptions = options.map((option: any) => ({
      bet_id: bet.id,
      name: option.name,
      odds: Number(option.odds),
    }))

    const { data: createdOptions, error: optionsError } = await supabase.from("bet_options").insert(betOptions).select()

    if (optionsError) {
      console.error("Error creating bet options:", optionsError)
      // Cleanup the bet if options failed
      await supabase.from("bets").delete().eq("id", bet.id)
      return NextResponse.json(
        { error: "Failed to create bet options", details: optionsError.message },
        { status: 500 },
      )
    }

    console.log("Bet options created:", createdOptions?.length)

    return NextResponse.json({
      bet: {
        ...bet,
        bet_options: createdOptions,
      },
      success: true,
    })
  } catch (error: any) {
    console.error("Unexpected error in POST /api/bets:", error)
    return NextResponse.json({ error: "Internal server error", details: error.message }, { status: 500 })
  } finally {
    console.log("=== POST /api/bets END ===")
  }
}

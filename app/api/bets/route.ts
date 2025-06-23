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

    // Use separate queries to avoid relationship ambiguity
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

    console.log("Bets fetched successfully:", bets?.length || 0)

    // Fetch bet options separately to avoid relationship issues
    const betIds = bets?.map((bet) => bet.id) || []
    let betOptions: any[] = []

    if (betIds.length > 0) {
      const { data: options, error: optionsError } = await supabase
        .from("bet_options")
        .select("*")
        .in("bet_id", betIds)
        .order("created_at", { ascending: true })

      if (optionsError) {
        console.error("Error fetching bet options:", optionsError)
        // Don't fail the whole request, just log the error
        console.warn("Continuing without bet options due to error:", optionsError.message)
      } else {
        betOptions = options || []
        console.log("Bet options fetched:", betOptions.length)
      }
    }

    // Combine bets with their options manually
    const betsWithOptions = (bets || []).map((bet) => ({
      ...bet,
      bet_options: betOptions.filter((option) => option.bet_id === bet.id),
      user_bets: [], // Will be populated separately if needed
    }))

    console.log("Final bets with options:", betsWithOptions.length)

    const response = NextResponse.json({
      bets: betsWithOptions,
      count: betsWithOptions.length,
      status: "success",
      timestamp: new Date().toISOString(),
    })

    // Add cache control headers
    response.headers.set("Cache-Control", "no-cache, no-store, must-revalidate")
    response.headers.set("Pragma", "no-cache")
    response.headers.set("Expires", "0")

    return response
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

    // Validate options
    const validOptions = options.filter((opt) => opt.name?.trim() && opt.odds > 0)
    if (validOptions.length === 0) {
      return NextResponse.json({ error: "At least one valid option is required" }, { status: 400 })
    }

    console.log("Creating bet with valid options:", validOptions.length)

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
    const betOptions = validOptions.map((option: any) => ({
      bet_id: bet.id,
      name: option.name.trim(),
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

    const response = NextResponse.json({
      bet: {
        ...bet,
        bet_options: createdOptions,
      },
      success: true,
      message: "Bet created successfully",
    })

    // Add cache control headers
    response.headers.set("Cache-Control", "no-cache, no-store, must-revalidate")
    response.headers.set("Pragma", "no-cache")
    response.headers.set("Expires", "0")

    return response
  } catch (error: any) {
    console.error("Unexpected error in POST /api/bets:", error)
    return NextResponse.json({ error: "Internal server error", details: error.message }, { status: 500 })
  } finally {
    console.log("=== POST /api/bets END ===")
  }
}

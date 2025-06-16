import { NextResponse } from "next/server"
import { createServerClient, isSupabaseConfigured } from "@/lib/supabase"

export async function POST() {
  console.log("=== POST /api/admin/fix-payments START ===")

  try {
    if (!isSupabaseConfigured()) {
      return NextResponse.json({ error: "Supabase not configured" }, { status: 503 })
    }

    const supabase = createServerClient()
    if (!supabase) {
      return NextResponse.json({ error: "Failed to initialize Supabase client" }, { status: 500 })
    }

    console.log("Calling fix_unpaid_winners function...")

    // Call the stored procedure to fix unpaid winners
    const { data: result, error: fixError } = await supabase.rpc("fix_unpaid_winners")

    if (fixError) {
      console.error("Error calling fix_unpaid_winners:", fixError)
      return NextResponse.json(
        {
          error: "Failed to fix payments",
          details: fixError.message,
        },
        { status: 500 },
      )
    }

    console.log("Fix payments result:", result)

    return NextResponse.json({
      success: true,
      message: "Payments fixed successfully",
      ...result,
    })
  } catch (error: any) {
    console.error("Unexpected error in POST /api/admin/fix-payments:", error)
    return NextResponse.json(
      {
        error: "Internal server error",
        details: error.message,
      },
      { status: 500 },
    )
  } finally {
    console.log("=== POST /api/admin/fix-payments END ===")
  }
}

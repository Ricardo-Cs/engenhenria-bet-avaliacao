import { NextResponse } from "next/server"
import { createServerClient, isSupabaseConfigured } from "@/lib/supabase"

export async function POST() {
  console.log("=== POST /api/admin/force-refresh START ===")

  try {
    if (!isSupabaseConfigured()) {
      return NextResponse.json({ error: "Supabase not configured" }, { status: 503 })
    }

    const supabase = createServerClient()
    if (!supabase) {
      return NextResponse.json({ error: "Failed to initialize Supabase client" }, { status: 500 })
    }

    console.log("Forcing data refresh...")

    // Call the stored procedure to force refresh
    const { data: result, error: refreshError } = await supabase.rpc("force_data_refresh")

    if (refreshError) {
      console.error("Error calling force_data_refresh:", refreshError)
      return NextResponse.json(
        {
          error: "Failed to force refresh",
          details: refreshError.message,
        },
        { status: 500 },
      )
    }

    console.log("Force refresh result:", result)

    return NextResponse.json({
      success: true,
      message: "Data refresh forced successfully",
      result,
      timestamp: new Date().toISOString(),
    })
  } catch (error: any) {
    console.error("Unexpected error in POST /api/admin/force-refresh:", error)
    return NextResponse.json(
      {
        error: "Internal server error",
        details: error.message,
      },
      { status: 500 },
    )
  } finally {
    console.log("=== POST /api/admin/force-refresh END ===")
  }
}

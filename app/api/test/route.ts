import { NextResponse } from "next/server"
import { createServerClient, isSupabaseConfigured } from "@/lib/supabase"

export async function GET() {
  try {
    // Test 1: Check environment variables
    const envCheck = {
      supabaseUrl: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
      supabaseAnonKey: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      supabaseServiceKey: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
    }

    // Test 2: Check Supabase configuration
    const isConfigured = isSupabaseConfigured()

    // Test 3: Try to create client
    const supabase = createServerClient()
    const clientCreated = !!supabase

    // Test 4: Try to connect to database
    let dbConnection = false
    let dbError = null
    let tableCount = 0

    if (supabase) {
      try {
        const { data, error } = await supabase.from("users").select("count", { count: "exact", head: true })
        if (!error) {
          dbConnection = true
          tableCount = data?.length || 0
        } else {
          dbError = error.message
        }
      } catch (err: any) {
        dbError = err.message
      }
    }

    return NextResponse.json({
      status: "API Test Results",
      environment: envCheck,
      supabaseConfigured: isConfigured,
      clientCreated,
      databaseConnection: dbConnection,
      databaseError: dbError,
      tableCount,
      timestamp: new Date().toISOString(),
    })
  } catch (error: any) {
    return NextResponse.json(
      {
        status: "API Test Failed",
        error: error.message,
        timestamp: new Date().toISOString(),
      },
      { status: 500 },
    )
  }
}

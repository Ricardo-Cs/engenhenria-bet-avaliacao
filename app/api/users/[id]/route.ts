import { type NextRequest, NextResponse } from "next/server"
import { createServerClient, isSupabaseConfigured } from "@/lib/supabase"

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  // Add timeout to prevent hanging requests
  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), 10000) // 10 second timeout

  try {
    if (!isSupabaseConfigured()) {
      return NextResponse.json({ error: "Supabase not configured" }, { status: 503 })
    }

    const supabase = createServerClient()

    if (!supabase) {
      return NextResponse.json({ error: "Failed to initialize Supabase client" }, { status: 500 })
    }

    const { data: user, error } = await supabase
      .from("users")
      .select("*")
      .eq("id", params.id)
      .single()
      .abortSignal(controller.signal)

    clearTimeout(timeoutId)

    if (error) {
      console.error("Supabase error:", error)
      throw error
    }

    return NextResponse.json({ user })
  } catch (error: any) {
    clearTimeout(timeoutId)
    console.error("Error fetching user:", error)

    if (error.name === "AbortError") {
      return NextResponse.json({ error: "Request timeout" }, { status: 408 })
    }

    return NextResponse.json({ error: "Failed to fetch user" }, { status: 500 })
  }
}

export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), 10000)

  try {
    if (!isSupabaseConfigured()) {
      return NextResponse.json({ error: "Supabase not configured" }, { status: 503 })
    }

    const supabase = createServerClient()

    if (!supabase) {
      return NextResponse.json({ error: "Failed to initialize Supabase client" }, { status: 500 })
    }

    const body = await request.json()
    const { data: user, error } = await supabase
      .from("users")
      .update(body)
      .eq("id", params.id)
      .select()
      .single()
      .abortSignal(controller.signal)

    clearTimeout(timeoutId)

    if (error) {
      console.error("Supabase error:", error)
      throw error
    }

    return NextResponse.json({ user })
  } catch (error: any) {
    clearTimeout(timeoutId)
    console.error("Error updating user:", error)

    if (error.name === "AbortError") {
      return NextResponse.json({ error: "Request timeout" }, { status: 408 })
    }

    return NextResponse.json({ error: "Failed to update user" }, { status: 500 })
  }
}

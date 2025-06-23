import { type NextRequest, NextResponse } from "next/server"
import { createServerClient, isSupabaseConfigured } from "@/lib/supabase"

export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  console.log("=== PATCH /api/admin/users/[id]/balance START ===")

  try {
    if (!isSupabaseConfigured()) {
      return NextResponse.json({ error: "Supabase not configured" }, { status: 503 })
    }

    const supabase = createServerClient()
    if (!supabase) {
      return NextResponse.json({ error: "Failed to initialize Supabase client" }, { status: 500 })
    }

    const body = await request.json()
    const { amount, operation } = body
    const userId = params.id

    console.log("Updating user balance:", userId, body)

    // Validate inputs
    if (!amount || !operation) {
      return NextResponse.json({ error: "Amount and operation are required" }, { status: 400 })
    }

    const numAmount = Number.parseFloat(amount)
    if (isNaN(numAmount) || numAmount <= 0) {
      return NextResponse.json({ error: "Amount must be a positive number" }, { status: 400 })
    }

    if (!["add", "subtract", "set"].includes(operation)) {
      return NextResponse.json({ error: "Invalid operation" }, { status: 400 })
    }

    // Get current user balance
    const { data: currentUser, error: fetchError } = await supabase
      .from("users")
      .select("balance, email, full_name, role")
      .eq("id", userId)
      .single()

    if (fetchError || !currentUser) {
      console.error("Error fetching user:", fetchError)
      return NextResponse.json({ error: "User not found", details: fetchError?.message }, { status: 404 })
    }

    console.log("Current user balance:", currentUser.balance)

    // Calculate new balance
    let newBalance: number
    switch (operation) {
      case "add":
        newBalance = currentUser.balance + numAmount
        break
      case "subtract":
        newBalance = Math.max(0, currentUser.balance - numAmount) // Don't allow negative balance
        break
      case "set":
        newBalance = numAmount
        break
      default:
        return NextResponse.json({ error: "Invalid operation" }, { status: 400 })
    }

    console.log("New balance calculated:", newBalance)

    // Update the user balance with explicit timestamp
    const { data: updatedUser, error: updateError } = await supabase
      .from("users")
      .update({
        balance: newBalance,
        updated_at: new Date().toISOString(),
      })
      .eq("id", userId)
      .select("*")
      .single()

    if (updateError) {
      console.error("Error updating user balance:", updateError)
      return NextResponse.json({ error: "Failed to update balance", details: updateError.message }, { status: 500 })
    }

    // Verify the update
    const { data: verifyUser, error: verifyError } = await supabase
      .from("users")
      .select("balance, updated_at")
      .eq("id", userId)
      .single()

    if (verifyError) {
      console.error("Error verifying balance update:", verifyError)
    } else {
      console.log("Verified balance update:", verifyUser)
    }

    console.log("User balance updated successfully:", {
      userId,
      email: currentUser.email,
      oldBalance: currentUser.balance,
      newBalance: updatedUser.balance,
      operation,
      amount: numAmount,
    })

    // Return response with cache control headers
    const response = NextResponse.json({
      user: updatedUser,
      oldBalance: currentUser.balance,
      newBalance: updatedUser.balance,
      operation,
      amount: numAmount,
      success: true,
      message: "Balance updated successfully",
      timestamp: new Date().toISOString(),
    })

    response.headers.set("Cache-Control", "no-cache, no-store, must-revalidate, max-age=0")
    response.headers.set("Pragma", "no-cache")
    response.headers.set("Expires", "0")
    response.headers.set("Last-Modified", new Date().toUTCString())

    return response
  } catch (error: any) {
    console.error("Unexpected error in PATCH /api/admin/users/[id]/balance:", error)
    return NextResponse.json({ error: "Internal server error", details: error.message }, { status: 500 })
  } finally {
    console.log("=== PATCH /api/admin/users/[id]/balance END ===")
  }
}

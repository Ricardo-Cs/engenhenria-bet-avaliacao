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
      .select("balance")
      .eq("id", userId)
      .single()

    if (fetchError || !currentUser) {
      console.error("Error fetching user:", fetchError)
      return NextResponse.json({ error: "User not found", details: fetchError?.message }, { status: 404 })
    }

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

    // Update the user balance
    const { data: updatedUser, error: updateError } = await supabase
      .from("users")
      .update({
        balance: newBalance,
        updated_at: new Date().toISOString(),
      })
      .eq("id", userId)
      .select()
      .single()

    if (updateError) {
      console.error("Error updating user balance:", updateError)
      return NextResponse.json({ error: "Failed to update balance", details: updateError.message }, { status: 500 })
    }

    console.log("User balance updated successfully:", {
      oldBalance: currentUser.balance,
      newBalance,
      operation,
      amount: numAmount,
    })

    return NextResponse.json({
      user: updatedUser,
      oldBalance: currentUser.balance,
      newBalance,
      operation,
      amount: numAmount,
      success: true,
      message: "Balance updated successfully",
    })
  } catch (error: any) {
    console.error("Unexpected error in PATCH /api/admin/users/[id]/balance:", error)
    return NextResponse.json({ error: "Internal server error", details: error.message }, { status: 500 })
  } finally {
    console.log("=== PATCH /api/admin/users/[id]/balance END ===")
  }
}

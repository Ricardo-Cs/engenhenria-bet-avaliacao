import { type NextRequest, NextResponse } from "next/server"
import { createServerClient, isSupabaseConfigured } from "@/lib/supabase"

export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  console.log("=== PATCH /api/admin/users/[id] START ===")

  try {
    if (!isSupabaseConfigured()) {
      return NextResponse.json({ error: "Supabase not configured" }, { status: 503 })
    }

    const supabase = createServerClient()
    if (!supabase) {
      return NextResponse.json({ error: "Failed to initialize Supabase client" }, { status: 500 })
    }

    const body = await request.json()
    const { full_name, role } = body
    const userId = params.id

    console.log("Updating user:", userId, body)

    // Validate role
    if (role && !["user", "admin"].includes(role)) {
      return NextResponse.json({ error: "Invalid role" }, { status: 400 })
    }

    // Update the user
    const { data: updatedUser, error: updateError } = await supabase
      .from("users")
      .update({
        full_name,
        role,
        updated_at: new Date().toISOString(),
      })
      .eq("id", userId)
      .select()
      .single()

    if (updateError) {
      console.error("Error updating user:", updateError)
      return NextResponse.json({ error: "Failed to update user", details: updateError.message }, { status: 500 })
    }

    console.log("User updated successfully")

    return NextResponse.json({
      user: updatedUser,
      success: true,
      message: "User updated successfully",
    })
  } catch (error: any) {
    console.error("Unexpected error in PATCH /api/admin/users/[id]:", error)
    return NextResponse.json({ error: "Internal server error", details: error.message }, { status: 500 })
  } finally {
    console.log("=== PATCH /api/admin/users/[id] END ===")
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  console.log("=== DELETE /api/admin/users/[id] START ===")

  try {
    if (!isSupabaseConfigured()) {
      return NextResponse.json({ error: "Supabase not configured" }, { status: 503 })
    }

    const supabase = createServerClient()
    if (!supabase) {
      return NextResponse.json({ error: "Failed to initialize Supabase client" }, { status: 500 })
    }

    const userId = params.id

    console.log("Deleting user:", userId)

    // Check if user has active bets
    const { data: userBets, error: betsError } = await supabase
      .from("user_bets")
      .select("id")
      .eq("user_id", userId)
      .eq("status", "active")
      .limit(1)

    if (betsError) {
      console.error("Error checking user bets:", betsError)
      return NextResponse.json({ error: "Failed to check user bets", details: betsError.message }, { status: 500 })
    }

    if (userBets && userBets.length > 0) {
      return NextResponse.json({ error: "Cannot delete user with active bets" }, { status: 400 })
    }

    // Delete from auth.users first (this will cascade to public.users)
    const { error: authDeleteError } = await supabase.auth.admin.deleteUser(userId)

    if (authDeleteError) {
      console.error("Error deleting auth user:", authDeleteError)
      return NextResponse.json({ error: "Failed to delete user", details: authDeleteError.message }, { status: 500 })
    }

    console.log("User deleted successfully")

    return NextResponse.json({
      success: true,
      message: "User deleted successfully",
    })
  } catch (error: any) {
    console.error("Unexpected error in DELETE /api/admin/users/[id]:", error)
    return NextResponse.json({ error: "Internal server error", details: error.message }, { status: 500 })
  } finally {
    console.log("=== DELETE /api/admin/users/[id] END ===")
  }
}

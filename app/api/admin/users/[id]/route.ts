import { type NextRequest, NextResponse } from "next/server"
import { createServerClient, isSupabaseConfigured } from "@/lib/supabase"
import { revalidatePath } from "next/cache"

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

    console.log("Updating user:", userId, "with data:", body)

    // Validate role
    if (role && !["user", "admin"].includes(role)) {
      return NextResponse.json({ error: "Invalid role" }, { status: 400 })
    }

    // Get current user data first
    const { data: currentUser, error: fetchError } = await supabase.from("users").select("*").eq("id", userId).single()

    if (fetchError || !currentUser) {
      console.error("Error fetching current user:", fetchError)
      return NextResponse.json({ error: "User not found", details: fetchError?.message }, { status: 404 })
    }

    console.log("Current user data:", currentUser)

    // Update the user with explicit timestamp and ensure the update happens
    const updateData = {
      ...(full_name !== undefined && { full_name }),
      ...(role !== undefined && { role }),
      updated_at: new Date().toISOString(),
    }

    console.log("Update data:", updateData)

    const { data: updatedUser, error: updateError } = await supabase
      .from("users")
      .update(updateData)
      .eq("id", userId)
      .select("*")
      .single()

    if (updateError) {
      console.error("Error updating user:", updateError)
      return NextResponse.json({ error: "Failed to update user", details: updateError.message }, { status: 500 })
    }

    console.log("User updated successfully:", updatedUser)

    // Verify the update actually happened
    const { data: verifyUser, error: verifyError } = await supabase.from("users").select("*").eq("id", userId).single()

    if (verifyError) {
      console.error("Error verifying update:", verifyError)
    } else {
      console.log("Verified updated user:", verifyUser)
    }

    // Force a refresh of the updated_at timestamp to ensure cache invalidation
    await supabase.from("users").update({ updated_at: new Date().toISOString() }).eq("id", userId)

    revalidatePath('/admin/users');

    // Return response with aggressive cache control
    const response = NextResponse.json({
      user: updatedUser,
      success: true,
      message: "User updated successfully",
      timestamp: new Date().toISOString(),
      changes: {
        full_name: { from: currentUser.full_name, to: updatedUser.full_name },
        role: { from: currentUser.role, to: updatedUser.role },
      },
    })

    response.headers.set("Cache-Control", "no-cache, no-store, must-revalidate, max-age=0")
    response.headers.set("Pragma", "no-cache")
    response.headers.set("Expires", "0")
    response.headers.set("Last-Modified", new Date().toUTCString())

    return response
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

    revalidatePath('/admin/users');

    return NextResponse.json({
      success: true,
      message: "User deleted successfully",
      timestamp: new Date().toISOString(),
    })
  } catch (error: any) {
    console.error("Unexpected error in DELETE /api/admin/users/[id]:", error)
    return NextResponse.json({ error: "Internal server error", details: error.message }, { status: 500 })
  } finally {
    console.log("=== DELETE /api/admin/users/[id] END ===")
  }
}

import { NextResponse } from "next/server"
import { createServerClient, isSupabaseConfigured } from "@/lib/supabase"

export async function POST() {
  console.log("=== POST /api/admin/users/sync START ===")

  try {
    if (!isSupabaseConfigured()) {
      return NextResponse.json({ error: "Supabase not configured" }, { status: 503 })
    }

    const supabase = createServerClient()
    if (!supabase) {
      return NextResponse.json({ error: "Failed to initialize Supabase client" }, { status: 500 })
    }

    console.log("Syncing auth users with public.users table")

    // Get all users from auth.users
    const { data: authUsers, error: authError } = await supabase.auth.admin.listUsers()

    if (authError) {
      console.error("Error listing auth users:", authError)
      return NextResponse.json({ error: "Failed to list auth users", details: authError.message }, { status: 500 })
    }

    console.log("Found auth users:", authUsers.users.length)

    // Get existing users from public.users
    const { data: publicUsers, error: publicError } = await supabase.from("users").select("id")

    if (publicError) {
      console.error("Error fetching public users:", publicError)
      return NextResponse.json({ error: "Failed to fetch public users", details: publicError.message }, { status: 500 })
    }

    const existingUserIds = new Set(publicUsers?.map((u) => u.id) || [])
    console.log("Existing public users:", existingUserIds.size)

    // Find users that exist in auth but not in public.users
    const missingUsers = authUsers.users.filter((authUser) => !existingUserIds.has(authUser.id))
    console.log("Missing users to sync:", missingUsers.length)

    let syncedCount = 0
    const syncResults = []

    // Insert missing users into public.users
    for (const authUser of missingUsers) {
      try {
        const { data: newUser, error: insertError } = await supabase
          .from("users")
          .insert({
            id: authUser.id,
            email: authUser.email || "",
            full_name: authUser.user_metadata?.full_name || authUser.user_metadata?.name || null,
            role: "user", // Default role
            balance: 1000.0, // Default balance
          })
          .select()
          .single()

        if (insertError) {
          console.error(`Error inserting user ${authUser.email}:`, insertError)
          syncResults.push({
            email: authUser.email,
            success: false,
            error: insertError.message,
          })
        } else {
          console.log(`Successfully synced user: ${authUser.email}`)
          syncedCount++
          syncResults.push({
            email: authUser.email,
            success: true,
            user: newUser,
          })
        }
      } catch (error: any) {
        console.error(`Unexpected error syncing user ${authUser.email}:`, error)
        syncResults.push({
          email: authUser.email,
          success: false,
          error: error.message,
        })
      }
    }

    console.log(`Sync completed. ${syncedCount} users synced successfully.`)

    return NextResponse.json({
      success: true,
      message: `Sync completed. ${syncedCount} users synced successfully.`,
      totalAuthUsers: authUsers.users.length,
      existingPublicUsers: existingUserIds.size,
      missingUsers: missingUsers.length,
      syncedUsers: syncedCount,
      results: syncResults,
    })
  } catch (error: any) {
    console.error("Unexpected error in POST /api/admin/users/sync:", error)
    return NextResponse.json({ error: "Internal server error", details: error.message }, { status: 500 })
  } finally {
    console.log("=== POST /api/admin/users/sync END ===")
  }
}

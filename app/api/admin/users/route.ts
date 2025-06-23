import { type NextRequest, NextResponse } from "next/server"
import { createServerClient, isSupabaseConfigured } from "@/lib/supabase"

export async function GET(request: NextRequest) {
  console.log("=== GET /api/admin/users START ===")

  try {
    if (!isSupabaseConfigured()) {
      return NextResponse.json({ error: "Supabase not configured" }, { status: 503 })
    }

    const supabase = createServerClient()
    if (!supabase) {
      return NextResponse.json({ error: "Failed to initialize Supabase client" }, { status: 500 })
    }

    console.log("Fetching all users for admin with forced refresh...")

    // Force a complete refresh by adding a timestamp parameter
    const timestamp = new Date().getTime()

    // First, ensure all auth users are synced
    try {
      const { data: authUsers, error: authError } = await supabase.auth.admin.listUsers()

      if (!authError && authUsers?.users) {
        console.log("Found auth users:", authUsers.users.length)

        // Get existing public users with fresh query
        const { data: existingUsers, error: existingError } = await supabase
          .from("users")
          .select("id, email, updated_at")
          .order("updated_at", { ascending: false })

        if (existingError) {
          console.error("Error fetching existing users:", existingError)
        } else {
          const existingIds = new Set(existingUsers?.map((u) => u.id) || [])
          const missingUsers = authUsers.users.filter((u) => !existingIds.has(u.id))

          if (missingUsers.length > 0) {
            console.log("Syncing missing users:", missingUsers.length)

            const usersToInsert = missingUsers.map((authUser) => ({
              id: authUser.id,
              email: authUser.email || "",
              full_name: authUser.user_metadata?.full_name || authUser.user_metadata?.name || null,
              role: "user" as const,
              balance: 1000.0,
            }))

            const { error: insertError } = await supabase.from("users").insert(usersToInsert)

            if (insertError) {
              console.error("Error inserting missing users:", insertError)
            } else {
              console.log("Successfully synced missing users")
            }
          }
        }
      }
    } catch (syncError) {
      console.error("Error during user sync:", syncError)
    }

    // Now fetch all users with a completely fresh query
    const { data: users, error } = await supabase.from("users").select("*").order("updated_at", { ascending: false })

    if (error) {
      console.error("Error fetching users:", error)
      return NextResponse.json(
        {
          error: "Failed to fetch users",
          details: error.message,
        },
        { status: 500 },
      )
    }

    console.log("Users fetched successfully:", users?.length || 0)

    // Log user details for debugging
    users?.forEach((user) => {
      console.log(`User: ${user.email}, Role: ${user.role}, Balance: ${user.balance}, Updated: ${user.updated_at}`)
    })

    // Create response with aggressive cache prevention
    const response = NextResponse.json({
      users: users || [],
      count: users?.length || 0,
      status: "success",
      timestamp: new Date().toISOString(),
      queryTimestamp: timestamp,
    })

    // Extremely aggressive cache control
    response.headers.set("Cache-Control", "no-cache, no-store, must-revalidate, max-age=0")
    response.headers.set("Pragma", "no-cache")
    response.headers.set("Expires", "0")
    response.headers.set("Last-Modified", new Date().toUTCString())
    response.headers.set("ETag", `"${timestamp}"`)

    return response
  } catch (error: any) {
    console.error("Unexpected error in GET /api/admin/users:", error)
    return NextResponse.json(
      {
        error: "Internal server error",
        details: error.message,
      },
      { status: 500 },
    )
  } finally {
    console.log("=== GET /api/admin/users END ===")
  }
}

import type { Response } from "express"
import pool from "../config/database"
import type { AuthRequest } from "../types"

export const createBet = async (req: AuthRequest, res: Response) => {
  const client = await pool.connect()

  try {
    await client.query("BEGIN")

    const { title, description, ends_at, options } = req.body
    const admin_id = req.user!.id

    // Create bet
    const betResult = await client.query(
      "INSERT INTO bets (title, description, admin_id, status, ends_at) VALUES ($1, $2, $3, $4, $5) RETURNING *",
      [title, description, admin_id, "active", ends_at],
    )

    const bet = betResult.rows[0]

    // Create bet options
    const optionPromises = options.map((option: any) =>
      client.query("INSERT INTO bet_options (bet_id, option_text, odds) VALUES ($1, $2, $3) RETURNING *", [
        bet.id,
        option.option_text,
        option.odds,
      ]),
    )

    const optionResults = await Promise.all(optionPromises)
    const createdOptions = optionResults.map((result) => result.rows[0])

    await client.query("COMMIT")

    res.status(201).json({
      message: "Bet created successfully",
      bet: {
        ...bet,
        options: createdOptions,
      },
    })
  } catch (error) {
    await client.query("ROLLBACK")
    console.error("Create bet error:", error)
    res.status(500).json({ error: "Internal server error" })
  } finally {
    client.release()
  }
}

export const getAllBets = async (req: AuthRequest, res: Response) => {
  try {
    const { status = "active", page = 1, limit = 10 } = req.query
    const offset = (Number(page) - 1) * Number(limit)

    const result = await pool.query(
      `
      SELECT 
        b.*,
        u.email as admin_email,
        json_agg(
          json_build_object(
            'id', bo.id,
            'option_text', bo.option_text,
            'odds', bo.odds
          )
        ) as options
      FROM bets b
      JOIN users u ON b.admin_id = u.id
      LEFT JOIN bet_options bo ON b.id = bo.bet_id
      WHERE b.status = $1
      GROUP BY b.id, u.email
      ORDER BY b.created_at DESC
      LIMIT $2 OFFSET $3
    `,
      [status, limit, offset],
    )

    const countResult = await pool.query("SELECT COUNT(*) FROM bets WHERE status = $1", [status])
    const total = Number.parseInt(countResult.rows[0].count)

    res.json({
      bets: result.rows,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        pages: Math.ceil(total / Number(limit)),
      },
    })
  } catch (error) {
    console.error("Get bets error:", error)
    res.status(500).json({ error: "Internal server error" })
  }
}

export const getBetById = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params

    const result = await pool.query(
      `
      SELECT 
        b.*,
        u.email as admin_email,
        json_agg(
          json_build_object(
            'id', bo.id,
            'option_text', bo.option_text,
            'odds', bo.odds
          )
        ) as options
      FROM bets b
      JOIN users u ON b.admin_id = u.id
      LEFT JOIN bet_options bo ON b.id = bo.bet_id
      WHERE b.id = $1
      GROUP BY b.id, u.email
    `,
      [id],
    )

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Bet not found" })
    }

    res.json({ bet: result.rows[0] })
  } catch (error) {
    console.error("Get bet error:", error)
    res.status(500).json({ error: "Internal server error" })
  }
}

export const placeBet = async (req: AuthRequest, res: Response) => {
  const client = await pool.connect()

  try {
    await client.query("BEGIN")

    const { bet_option_id, amount } = req.body
    const user_id = req.user!.id

    // Check user balance
    const userResult = await client.query("SELECT balance FROM users WHERE id = $1", [user_id])
    const userBalance = Number.parseFloat(userResult.rows[0].balance)

    if (userBalance < amount) {
      await client.query("ROLLBACK")
      return res.status(400).json({ error: "Insufficient balance" })
    }

    // Get bet option and check if bet is still active
    const optionResult = await client.query(
      `
      SELECT bo.*, b.status, b.ends_at
      FROM bet_options bo
      JOIN bets b ON bo.bet_id = b.id
      WHERE bo.id = $1
    `,
      [bet_option_id],
    )

    if (optionResult.rows.length === 0) {
      await client.query("ROLLBACK")
      return res.status(404).json({ error: "Bet option not found" })
    }

    const option = optionResult.rows[0]

    if (option.status !== "active" || new Date() > new Date(option.ends_at)) {
      await client.query("ROLLBACK")
      return res.status(400).json({ error: "Bet is no longer active" })
    }

    const potential_payout = amount * option.odds

    // Create user bet
    const userBetResult = await client.query(
      "INSERT INTO user_bets (user_id, bet_option_id, amount, potential_payout, status) VALUES ($1, $2, $3, $4, $5) RETURNING *",
      [user_id, bet_option_id, amount, potential_payout, "pending"],
    )

    // Update user balance
    await client.query("UPDATE users SET balance = balance - $1 WHERE id = $2", [amount, user_id])

    await client.query("COMMIT")

    res.status(201).json({
      message: "Bet placed successfully",
      user_bet: userBetResult.rows[0],
    })
  } catch (error) {
    await client.query("ROLLBACK")
    console.error("Place bet error:", error)
    res.status(500).json({ error: "Internal server error" })
  } finally {
    client.release()
  }
}

export const resolveBet = async (req: AuthRequest, res: Response) => {
  const client = await pool.connect()

  try {
    await client.query("BEGIN")

    const { id } = req.params
    const { winning_option_id } = req.body

    // Update bet status
    await client.query("UPDATE bets SET status = $1, resolved_at = NOW(), winning_option_id = $2 WHERE id = $3", [
      "resolved",
      winning_option_id,
      id,
    ])

    // Get all user bets for this bet
    const userBetsResult = await client.query(
      `
      SELECT ub.*, u.id as user_id
      FROM user_bets ub
      JOIN bet_options bo ON ub.bet_option_id = bo.id
      JOIN users u ON ub.user_id = u.id
      WHERE bo.bet_id = $1
    `,
      [id],
    )

    // Process payouts
    for (const userBet of userBetsResult.rows) {
      if (userBet.bet_option_id === Number.parseInt(winning_option_id)) {
        // Winner - update status and add payout to balance
        await client.query("UPDATE user_bets SET status = $1 WHERE id = $2", ["won", userBet.id])
        await client.query("UPDATE users SET balance = balance + $1 WHERE id = $2", [
          userBet.potential_payout,
          userBet.user_id,
        ])
      } else {
        // Loser - update status
        await client.query("UPDATE user_bets SET status = $1 WHERE id = $2", ["lost", userBet.id])
      }
    }

    await client.query("COMMIT")

    res.json({ message: "Bet resolved successfully" })
  } catch (error) {
    await client.query("ROLLBACK")
    console.error("Resolve bet error:", error)
    res.status(500).json({ error: "Internal server error" })
  } finally {
    client.release()
  }
}

export const getUserBets = async (req: AuthRequest, res: Response) => {
  try {
    const user_id = req.user!.id
    const { page = 1, limit = 10 } = req.query
    const offset = (Number(page) - 1) * Number(limit)

    const result = await pool.query(
      `
      SELECT 
        ub.*,
        bo.option_text,
        bo.odds,
        b.title as bet_title,
        b.status as bet_status
      FROM user_bets ub
      JOIN bet_options bo ON ub.bet_option_id = bo.id
      JOIN bets b ON bo.bet_id = b.id
      WHERE ub.user_id = $1
      ORDER BY ub.created_at DESC
      LIMIT $2 OFFSET $3
    `,
      [user_id, limit, offset],
    )

    const countResult = await pool.query("SELECT COUNT(*) FROM user_bets WHERE user_id = $1", [user_id])
    const total = Number.parseInt(countResult.rows[0].count)

    res.json({
      bets: result.rows,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        pages: Math.ceil(total / Number(limit)),
      },
    })
  } catch (error) {
    console.error("Get user bets error:", error)
    res.status(500).json({ error: "Internal server error" })
  }
}

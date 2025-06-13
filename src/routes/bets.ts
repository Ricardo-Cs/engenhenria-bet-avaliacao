import { Router } from "express"
import { createBet, getAllBets, getBetById, placeBet, resolveBet, getUserBets } from "../controllers/betController"
import { authenticateToken, requireAdmin } from "../middleware/auth"
import { validateBet, validateUserBet } from "../middleware/validation"

const router = Router()

// Public routes
router.get("/", getAllBets)
router.get("/:id", getBetById)

// Protected routes
router.use(authenticateToken)
router.get("/user/my-bets", getUserBets)
router.post("/place", validateUserBet, placeBet)

// Admin routes
router.post("/", requireAdmin, validateBet, createBet)
router.put("/:id/resolve", requireAdmin, resolveBet)

export default router

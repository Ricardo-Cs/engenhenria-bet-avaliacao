import { body, validationResult } from "express-validator"
import type { Request, Response, NextFunction } from "express"

export const validateRequest = (req: Request, res: Response, next: NextFunction) => {
  const errors = validationResult(req)
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() })
  }
  next()
}

export const validateRegister = [
  body("email").isEmail().normalizeEmail(),
  body("password").isLength({ min: 6 }).withMessage("Password must be at least 6 characters"),
  validateRequest,
]

export const validateLogin = [
  body("email").isEmail().normalizeEmail(),
  body("password").notEmpty().withMessage("Password is required"),
  validateRequest,
]

export const validateBet = [
  body("title").notEmpty().withMessage("Title is required"),
  body("description").notEmpty().withMessage("Description is required"),
  body("ends_at").isISO8601().withMessage("Valid end date is required"),
  body("options").isArray({ min: 2 }).withMessage("At least 2 options are required"),
  body("options.*.option_text").notEmpty().withMessage("Option text is required"),
  body("options.*.odds").isFloat({ min: 1.01 }).withMessage("Odds must be greater than 1.01"),
  validateRequest,
]

export const validateUserBet = [
  body("bet_option_id").isInt({ min: 1 }).withMessage("Valid bet option ID is required"),
  body("amount").isFloat({ min: 0.01 }).withMessage("Amount must be greater than 0"),
  validateRequest,
]

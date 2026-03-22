/**
 * ─────────────────────────────────────────────────────────────────────────────
 * AUTH ROUTES  (routes/authRoutes.js)
 * ─────────────────────────────────────────────────────────────────────────────
 * Maps HTTP verb + URL pattern → controller function.
 * The `protect` middleware guards private routes.
 *
 * Public routes (no token required):
 *   POST /api/auth/register
 *   POST /api/auth/login
 *
 * Protected routes (token required):
 *   GET  /api/auth/me
 */

const express = require("express");
const router = express.Router();
const { register, login, getMe } = require("../controllers/authController");
const { protect } = require("../middleware/authMiddleware");

router.post("/register", register);
router.post("/login", login);
router.get("/me", protect, getMe); // protect runs first, then getMe

module.exports = router;

/**
 * ─────────────────────────────────────────────────────────────────────────────
 * AUTH CONTROLLER  (controllers/authController.js)
 * ─────────────────────────────────────────────────────────────────────────────
 * Handles the business logic for user authentication:
 *   - register  → POST /api/auth/register
 *   - login     → POST /api/auth/login
 *   - getMe     → GET  /api/auth/me  (protected)
 *
 * Controllers vs Routes vs Middleware
 * ────────────────────────────────────
 * Route   → defines the URL pattern and HTTP verb
 * Middleware → guards the route (auth check, rate limiting)
 * Controller → the actual business logic that runs when the route matches
 *
 * Keeping controllers separate from routes makes each file focused and testable.
 */

const asyncHandler = require("express-async-handler");
const User = require("../models/User");
const generateToken = require("../utils/generateToken");
const { validateRegisterInput, validateLoginInput } = require("../utils/validators");
const { sendSuccess, sendError } = require("../utils/responseHandler");

/* ─────────────────────────────────────────────────────────────────────────── */
/*  Helper: shape the user object returned to the client                       */
/*  We never return the password hash — this helper enforces that rule.        */
/* ─────────────────────────────────────────────────────────────────────────── */
const formatUserResponse = (user, token) => ({
  _id: user._id,
  name: user.name,
  email: user.email,
  createdAt: user.createdAt,
  token,
});

/* ─────────────────────────────────────────────────────────────────────────── */
/*  REGISTER                                                                   */
/* ─────────────────────────────────────────────────────────────────────────── */
/**
 * register
 * --------
 * Creates a new user account.
 *
 * Steps:
 *   1. Validate request body fields.
 *   2. Check if email is already taken.
 *   3. Create user (pre-save hook in model hashes password).
 *   4. Generate JWT.
 *   5. Return user data + token.
 *
 * HTTP 201 = Created (standard for successful resource creation).
 */
const register = asyncHandler(async (req, res) => {
  const { name, email, password } = req.body;

  // ── 1. Validate input ──────────────────────────────────────────────────────
  const { isValid, errors } = validateRegisterInput({ name, email, password });
  if (!isValid) {
    return sendError(res, 400, "Validation failed", errors);
  }

  // ── 2. Duplicate email check ───────────────────────────────────────────────
  const existingUser = await User.findOne({ email: email.toLowerCase() });
  if (existingUser) {
    return sendError(res, 409, "An account with this email already exists");
  }

  // ── 3. Create user (password hashed by pre-save hook) ────────────────────
  const user = await User.create({ name, email, password });

  // ── 4 & 5. Generate token and respond ─────────────────────────────────────
  const token = generateToken(user._id);
  return sendSuccess(res, 201, "Account created successfully", formatUserResponse(user, token));
});

/* ─────────────────────────────────────────────────────────────────────────── */
/*  LOGIN                                                                      */
/* ─────────────────────────────────────────────────────────────────────────── */
/**
 * login
 * -----
 * Authenticates an existing user.
 *
 * Steps:
 *   1. Validate input.
 *   2. Find user by email (must select password since schema uses select:false).
 *   3. Compare provided password against stored bcrypt hash.
 *   4. Generate JWT.
 *   5. Return user data + token.
 *
 * Security note: we return the SAME generic error whether the email doesn't
 * exist OR the password is wrong.  This prevents user-enumeration attacks —
 * an attacker cannot learn which emails are registered.
 */
const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  // ── 1. Validate input ──────────────────────────────────────────────────────
  const { isValid, errors } = validateLoginInput({ email, password });
  if (!isValid) {
    return sendError(res, 400, "Validation failed", errors);
  }

  // ── 2. Find user — include password field (excluded by default) ────────────
  const user = await User.findOne({ email: email.toLowerCase() }).select("+password");

  // ── 3. Verify password ─────────────────────────────────────────────────────
  if (!user || !(await user.matchPassword(password))) {
    // Deliberately vague message — see security note above
    return sendError(res, 401, "Invalid email or password");
  }

  // ── 4 & 5. Generate token and respond ─────────────────────────────────────
  const token = generateToken(user._id);
  return sendSuccess(res, 200, "Logged in successfully", formatUserResponse(user, token));
});

/* ─────────────────────────────────────────────────────────────────────────── */
/*  GET ME  (protected)                                                        */
/* ─────────────────────────────────────────────────────────────────────────── */
/**
 * getMe
 * -----
 * Returns the currently authenticated user's profile.
 * The `protect` middleware already populated req.user before this runs.
 *
 * Useful for:
 *   - Bootstrapping the frontend on page load (is the stored token still valid?)
 *   - Displaying profile info without a separate profile endpoint
 */
const getMe = asyncHandler(async (req, res) => {
  // req.user is set by the protect middleware
  return sendSuccess(res, 200, "User profile fetched", {
    _id: req.user._id,
    name: req.user.name,
    email: req.user.email,
    createdAt: req.user.createdAt,
  });
});

module.exports = { register, login, getMe };

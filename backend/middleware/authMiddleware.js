/**
 * ─────────────────────────────────────────────────────────────────────────────
 * AUTH MIDDLEWARE  (middleware/authMiddleware.js)
 * ─────────────────────────────────────────────────────────────────────────────
 * Express middleware that protects private routes by verifying the JWT
 * attached to incoming requests.
 *
 * Middleware in Express
 * ─────────────────────
 * A middleware is a function with signature (req, res, next).
 * It sits in the request pipeline between the router and the final handler.
 * Calling next() passes control to the next middleware/handler.
 * NOT calling next() (and sending a response instead) short-circuits the chain.
 *
 * Flow for a protected route:
 *   Client → [protect middleware] → [route handler]
 *                  ↓ (if token invalid)
 *               401 Unauthorized
 */

const jwt = require("jsonwebtoken");
const asyncHandler = require("express-async-handler");
const User = require("../models/User");
const { sendError } = require("../utils/responseHandler");

/**
 * protect
 * -------
 * 1. Extract the Bearer token from the Authorization header.
 * 2. Verify its signature with JWT_SECRET.
 * 3. Decode the payload to get the user's id.
 * 4. Look up the user in the DB and attach them to req.user.
 * 5. Call next() — the actual route handler can now trust req.user.
 *
 * The `asyncHandler` wrapper catches any thrown async errors and passes
 * them to Express's error-handling middleware instead of crashing the process.
 *
 * Token format in the Authorization header:
 *   Authorization: Bearer <token>
 */
const protect = asyncHandler(async (req, res, next) => {
  let token;

  // ── Step 1: Extract token ──────────────────────────────────────────────────
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith("Bearer ")
  ) {
    token = req.headers.authorization.split(" ")[1]; // grab the part after "Bearer "
  }

  if (!token) {
    return sendError(res, 401, "Not authorised — no token provided");
  }

  // ── Step 2 & 3: Verify and decode ─────────────────────────────────────────
  let decoded;
  try {
    decoded = jwt.verify(token, process.env.JWT_SECRET);
    // decoded = { id: "...", iat: <issued-at>, exp: <expires-at> }
  } catch (error) {
    // jwt.verify throws JsonWebTokenError for invalid tokens
    // and TokenExpiredError for expired ones
    const message =
      error.name === "TokenExpiredError"
        ? "Token has expired — please log in again"
        : "Invalid token — please log in again";
    return sendError(res, 401, message);
  }

  // ── Step 4: Fetch user from DB ─────────────────────────────────────────────
  // We re-fetch from DB (not just trust the token) so that if an account is
  // deleted or suspended, existing tokens immediately stop working.
  const user = await User.findById(decoded.id).select("-password");

  if (!user) {
    return sendError(res, 401, "User no longer exists");
  }

  // ── Step 5: Attach user and pass control ──────────────────────────────────
  req.user = user; // downstream handlers can read req.user
  next();
});

module.exports = { protect };

/**
 * ─────────────────────────────────────────────────────────────────────────────
 * GLOBAL ERROR HANDLER MIDDLEWARE  (middleware/errorHandler.js)
 * ─────────────────────────────────────────────────────────────────────────────
 * Express's special 4-argument middleware — (err, req, res, next) — is called
 * automatically whenever:
 *   - a synchronous route handler throws an error
 *   - an async handler passes an error to next(error)
 *   - asyncHandler catches a rejected promise
 *
 * Having one global handler means we don't scatter try/catch everywhere.
 * It also ensures consistent error response shape across all routes.
 */

const { sendError } = require("../utils/responseHandler");

/**
 * notFound
 * --------
 * Handles 404 — no route matched the request.
 * Must be placed AFTER all routes so it only fires if nothing else matched.
 */
const notFound = (req, res, next) => {
  const error = new Error(`Route not found: ${req.originalUrl}`);
  error.statusCode = 404;
  next(error); // forward to errorHandler below
};

/**
 * errorHandler
 * ------------
 * Catches all errors forwarded via next(err) or thrown in async handlers.
 *
 * Mongoose error types we handle specially:
 *   CastError         → invalid ObjectId format (e.g., /api/todos/abc)
 *   ValidationError   → Mongoose schema validation failed
 *   11000 (duplicate) → unique index violation (duplicate email)
 *
 * In production we hide internal stack traces from the client for security.
 */
const errorHandler = (err, req, res, next) => {
  let statusCode = err.statusCode || err.status || 500;
  let message = err.message || "Internal Server Error";

  // ── Mongoose CastError (bad ObjectId) ─────────────────────────────────────
  if (err.name === "CastError") {
    statusCode = 400;
    message = `Invalid ID format: ${err.value}`;
  }

  // ── Mongoose ValidationError ───────────────────────────────────────────────
  if (err.name === "ValidationError") {
    statusCode = 400;
    message = Object.values(err.errors)
      .map((e) => e.message)
      .join(", ");
  }

  // ── MongoDB Duplicate Key (code 11000) ────────────────────────────────────
  if (err.code === 11000) {
    statusCode = 409;
    const field = Object.keys(err.keyValue)[0];
    message = `Duplicate value for field: ${field}`;
  }

  // Log stack trace in development only
  if (process.env.NODE_ENV !== "production") {
    console.error(`[ERROR] ${statusCode} — ${message}`);
    if (err.stack) console.error(err.stack);
  }

  return sendError(res, statusCode, message);
};

module.exports = { notFound, errorHandler };

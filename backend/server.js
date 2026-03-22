/**
 * ─────────────────────────────────────────────────────────────────────────────
 * SERVER ENTRY POINT  (server.js)
 * ─────────────────────────────────────────────────────────────────────────────
 * This is the application's bootstrap file.  It:
 *   1. Loads environment variables from .env
 *   2. Connects to MongoDB
 *   3. Wires up Express middleware (JSON parsing, CORS, routes)
 *   4. Attaches error handling middleware
 *   5. Starts the HTTP server
 *
 * Keeping this file thin (no business logic) makes testing easier —
 * we can import and test individual modules without spinning up the server.
 */

require("dotenv").config(); // Must be first — loads .env into process.env

const express = require("express");
const cors = require("cors");
const connectDB = require("./config/db");
const authRoutes = require("./routes/authRoutes");
const todoRoutes = require("./routes/todoRoutes");
const { notFound, errorHandler } = require("./middleware/errorHandler");

// ── Connect to database ───────────────────────────────────────────────────────
connectDB();

// ── Create Express app ────────────────────────────────────────────────────────
const app = express();

/* ─── Core Middleware ────────────────────────────────────────────────────── */

/**
 * CORS — Cross-Origin Resource Sharing
 * Allows our React frontend (different port in dev) to call the API.
 * In production, restrict the origin to your actual domain.
 */
app.use(
  cors({
    origin: process.env.FRONTEND_URL || "http://localhost:5173",
    credentials: true, // allows cookies if we ever add them
  })
);

/**
 * express.json() — parses incoming requests with JSON bodies.
 * Without this, req.body would be undefined for POST/PUT requests.
 */
app.use(express.json({ limit: "10kb" })); // limit prevents large payload attacks

/**
 * express.urlencoded() — parses URL-encoded form bodies (not strictly needed
 * for a JSON API but good practice).
 */
app.use(express.urlencoded({ extended: false }));

/* ─── Health Check ───────────────────────────────────────────────────────── */
/**
 * Simple health-check endpoint.
 * Docker and load balancers can hit this to verify the container is alive.
 */
app.get("/health", (req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

/* ─── API Routes ─────────────────────────────────────────────────────────── */
/**
 * Mount routers at their base paths.
 * e.g., authRoutes handles POST /api/auth/register
 *       todoRoutes handles GET  /api/todos
 */
app.use("/api/auth", authRoutes);
app.use("/api/todos", todoRoutes);

/* ─── Error Handling Middleware ──────────────────────────────────────────── */
// Must come AFTER all routes
app.use(notFound);     // catches unmatched routes → 404
app.use(errorHandler); // catches all forwarded errors

/* ─── Start Server ───────────────────────────────────────────────────────── */
const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`🚀  Server running on http://localhost:${PORT} in ${process.env.NODE_ENV} mode`);
});

module.exports = app; // export for testing

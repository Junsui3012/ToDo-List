/**
 * ─────────────────────────────────────────────────────────────────────────────
 * DATABASE CONNECTION  (config/db.js)
 * ─────────────────────────────────────────────────────────────────────────────
 * Responsibility: Establish and manage the MongoDB connection via Mongoose.
 *
 * Why a dedicated file?
 *   Separating DB logic from the main server entry point means:
 *   - We can import it from anywhere without circular dependencies.
 *   - Tests can mock or swap this module in isolation.
 *   - Retry / reconnect logic lives in one place.
 */

const mongoose = require("mongoose");

/**
 * connectDB
 * ---------
 * Async function that opens the Mongoose connection.
 * Called once at server startup (server.js).
 *
 * On failure the process exits so Docker / the orchestrator can restart it.
 * In production you'd add exponential back-off retries here instead.
 */
const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGO_URI, {
      // These options prevent deprecation warnings and enable the new
      // connection string parser introduced in MongoDB driver v4.
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    console.log(`✅  MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.error(`❌  MongoDB connection error: ${error.message}`);
    // Exit with failure code — Docker will restart the container
    process.exit(1);
  }
};

module.exports = connectDB;

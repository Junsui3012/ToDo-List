/**
 * ─────────────────────────────────────────────────────────────────────────────
 * TODO MODEL  (models/Todo.js)
 * ─────────────────────────────────────────────────────────────────────────────
 * Defines the shape of a Todo document.
 * Each todo belongs to exactly one user via a MongoDB ObjectId reference.
 */

const mongoose = require("mongoose");

/**
 * todoSchema
 * ----------
 * Fields:
 *   title      - The task description (required)
 *   completed  - Boolean status, defaults to false (not done yet)
 *   priority   - Enum: low | medium | high — lets users sort by urgency
 *   dueDate    - Optional deadline
 *   user       - ObjectId reference to the User who owns this todo
 *                Using a ref enables Mongoose's .populate() to JOIN the user data
 *   timestamps - Mongoose auto-manages createdAt / updatedAt
 */
const todoSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, "Todo title is required"],
      trim: true,
      minlength: [1, "Title cannot be empty"],
      maxlength: [200, "Title cannot exceed 200 characters"],
    },
    completed: {
      type: Boolean,
      default: false, // every new todo starts as incomplete
    },
    priority: {
      type: String,
      enum: {
        values: ["low", "medium", "high"],
        message: "Priority must be low, medium, or high",
      },
      default: "medium",
    },
    dueDate: {
      type: Date,
      default: null,
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",        // tells Mongoose which collection to populate from
      required: [true, "Todo must belong to a user"],
      index: true,        // speeds up queries filtered by user
    },
  },
  {
    timestamps: true,
  }
);

/* ─── Compound index ─────────────────────────────────────────────────────── */
/**
 * Compound index on (user, createdAt desc).
 * When the frontend fetches todos for a specific user ordered by creation date,
 * MongoDB can resolve the query using only this index — a "covered query" —
 * without touching the actual documents, making reads very fast.
 */
todoSchema.index({ user: 1, createdAt: -1 });

const Todo = mongoose.model("Todo", todoSchema);

module.exports = Todo;

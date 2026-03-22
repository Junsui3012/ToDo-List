/**
 * ─────────────────────────────────────────────────────────────────────────────
 * USER MODEL  (models/User.js)
 * ─────────────────────────────────────────────────────────────────────────────
 * Defines the shape of a User document inside MongoDB.
 * Also contains password hashing logic as a pre-save hook — keeping all
 * user-related transformations co-located with the model itself.
 */

const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

/**
 * userSchema
 * ----------
 * Mongoose Schema → blueprint for every User document.
 *
 * Fields:
 *   name       - Display name, required, trimmed
 *   email      - Must be unique (sparse index created automatically by Mongoose)
 *   password   - Stored as bcrypt hash, never plain text
 *   timestamps - Mongoose adds createdAt & updatedAt automatically
 */
const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Name is required"],
      trim: true,
      minlength: [2, "Name must be at least 2 characters"],
      maxlength: [50, "Name cannot exceed 50 characters"],
    },
    email: {
      type: String,
      required: [true, "Email is required"],
      unique: true,
      lowercase: true,  // normalise before storing
      trim: true,
      match: [
        /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,})+$/,
        "Please provide a valid email",
      ],
    },
    password: {
      type: String,
      required: [true, "Password is required"],
      minlength: [6, "Password must be at least 6 characters"],
      // select: false means password is excluded from query results by default
      // — you must explicitly ask for it with .select('+password')
      select: false,
    },
  },
  {
    timestamps: true, // adds createdAt, updatedAt
  }
);

/* ─── Pre-save hook ──────────────────────────────────────────────────────── */
/**
 * Before saving a User document, hash the password IF it was modified.
 * The `isModified` check prevents re-hashing an already-hashed password
 * when other fields (like name) are updated.
 *
 * bcrypt.genSalt(10) → cost factor 10 means 2^10 = 1024 iterations.
 * Higher = slower (safer) but too high degrades UX.  10 is the industry default.
 */
userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();

  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

/* ─── Instance method ────────────────────────────────────────────────────── */
/**
 * matchPassword
 * -------------
 * Compares a plain-text candidate with the stored bcrypt hash.
 * Returns a boolean Promise — used in auth controller.
 *
 * Why an instance method and not a standalone function?
 *   It keeps the concern with the model and "this" gives us the stored hash
 *   without an extra DB query.
 */
userSchema.methods.matchPassword = async function (candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

const User = mongoose.model("User", userSchema);

module.exports = User;

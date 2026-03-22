/**
 * ─────────────────────────────────────────────────────────────────────────────
 * VALIDATORS UTILITY  (utils/validators.js)
 * ─────────────────────────────────────────────────────────────────────────────
 * Pure functions that validate input data before it reaches the DB layer.
 *
 * Why validate here AND in the Mongoose schema?
 *   Mongoose validation runs at the DB layer — it's a last line of defence.
 *   These validators run at the controller layer, giving us:
 *   1. Faster rejection (no DB round-trip)
 *   2. Friendlier, aggregated error messages for the client
 *   3. Custom logic not easily expressed as Mongoose validators
 */

/**
 * isValidEmail
 * ------------
 * Simple RFC-5322-inspired regex check.
 * Returns true if the string looks like a valid email address.
 *
 * @param {string} email
 * @returns {boolean}
 */
const isValidEmail = (email) => {
  const emailRegex = /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,})+$/;
  return emailRegex.test(email);
};

/**
 * validateRegisterInput
 * ----------------------
 * Checks all registration fields and returns an object:
 *   { isValid: boolean, errors: string[] }
 *
 * Collecting ALL errors at once (instead of failing on the first) means the
 * user sees everything wrong in one shot — better UX.
 *
 * @param {object} param0 - { name, email, password }
 * @returns {{ isValid: boolean, errors: string[] }}
 */
const validateRegisterInput = ({ name, email, password }) => {
  const errors = [];

  if (!name || name.trim().length < 2) {
    errors.push("Name must be at least 2 characters");
  }

  if (!email || !isValidEmail(email)) {
    errors.push("Please provide a valid email address");
  }

  if (!password || password.length < 6) {
    errors.push("Password must be at least 6 characters");
  }

  return { isValid: errors.length === 0, errors };
};

/**
 * validateLoginInput
 * ------------------
 * Checks login fields — email and password presence only.
 * We don't reveal whether email or password is wrong to prevent
 * user enumeration attacks (an attacker learning which emails exist).
 *
 * @param {object} param0 - { email, password }
 * @returns {{ isValid: boolean, errors: string[] }}
 */
const validateLoginInput = ({ email, password }) => {
  const errors = [];

  if (!email || !isValidEmail(email)) {
    errors.push("Please provide a valid email address");
  }

  if (!password) {
    errors.push("Password is required");
  }

  return { isValid: errors.length === 0, errors };
};

/**
 * validateTodoInput
 * -----------------
 * Validates todo creation / update fields.
 *
 * @param {object} param0 - { title, priority, dueDate }
 * @returns {{ isValid: boolean, errors: string[] }}
 */
const validateTodoInput = ({ title, priority, dueDate }) => {
  const errors = [];

  if (!title || title.trim().length === 0) {
    errors.push("Todo title is required");
  }

  if (title && title.trim().length > 200) {
    errors.push("Title cannot exceed 200 characters");
  }

  const validPriorities = ["low", "medium", "high"];
  if (priority && !validPriorities.includes(priority)) {
    errors.push("Priority must be low, medium, or high");
  }

  if (dueDate && isNaN(new Date(dueDate).getTime())) {
    errors.push("Invalid due date format");
  }

  return { isValid: errors.length === 0, errors };
};

module.exports = { validateRegisterInput, validateLoginInput, validateTodoInput, isValidEmail };

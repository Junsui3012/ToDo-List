/**
 * ─────────────────────────────────────────────────────────────────────────────
 * RESPONSE HANDLER UTILITY  (utils/responseHandler.js)
 * ─────────────────────────────────────────────────────────────────────────────
 * Standardises every API response so the frontend always receives the same
 * envelope shape — regardless of which endpoint is called.
 *
 * Standard envelope:
 *   { success: boolean, message: string, data?: any, errors?: string[] }
 *
 * Why an envelope pattern?
 *   Without it, different endpoints might return raw objects, arrays,
 *   or error strings in inconsistent shapes, making frontend parsing brittle.
 *   A consistent shape means ONE generic error handler on the client side.
 */

/**
 * sendSuccess
 * -----------
 * Sends a 2xx JSON response.
 *
 * @param {object} res      - Express response object
 * @param {number} status   - HTTP status code (200, 201, etc.)
 * @param {string} message  - Human-readable success message
 * @param {any}    data     - Payload to send (object, array, etc.)
 */
const sendSuccess = (res, status, message, data = null) => {
  const response = { success: true, message };
  if (data !== null) response.data = data;
  return res.status(status).json(response);
};

/**
 * sendError
 * ---------
 * Sends a 4xx/5xx JSON response.
 *
 * @param {object}   res     - Express response object
 * @param {number}   status  - HTTP status code (400, 401, 404, 500, etc.)
 * @param {string}   message - Human-readable error summary
 * @param {string[]} errors  - Array of specific error details (optional)
 */
const sendError = (res, status, message, errors = []) => {
  const response = { success: false, message };
  if (errors.length > 0) response.errors = errors;
  return res.status(status).json(response);
};

module.exports = { sendSuccess, sendError };

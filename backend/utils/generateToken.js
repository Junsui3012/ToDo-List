/**
 * ─────────────────────────────────────────────────────────────────────────────
 * TOKEN UTILITY  (utils/generateToken.js)
 * ─────────────────────────────────────────────────────────────────────────────
 * Single responsibility: create a signed JWT for a given user ID.
 *
 * JSON Web Tokens (JWT)
 * ---------------------
 * A JWT is a compact, URL-safe token composed of three Base64URL-encoded parts:
 *
 *   HEADER.PAYLOAD.SIGNATURE
 *
 *   Header   → algorithm & token type  { alg: "HS256", typ: "JWT" }
 *   Payload  → claims (data we encode) { id: "...", iat: ..., exp: ... }
 *   Signature → HMAC-SHA256(header + "." + payload, JWT_SECRET)
 *
 * The server never stores tokens.  On each request the client sends the token,
 * the server re-derives the signature and verifies it matches — proving the
 * payload has not been tampered with.
 *
 * Why JWT instead of server-side sessions?
 *   - Stateless: no session store needed → horizontally scalable
 *   - Self-contained: user info embedded in token → fewer DB lookups
 *   - Works naturally with mobile clients & SPAs
 */

const jwt = require("jsonwebtoken");

/**
 * generateToken
 * -------------
 * @param {string} userId  - MongoDB ObjectId (as string) of the authenticated user
 * @returns {string}       - Signed JWT string
 *
 * The token encodes the user's _id as the `id` claim.
 * The `expiresIn` option embeds an `exp` claim — after which the token is invalid.
 * JWT_SECRET is loaded from .env — never hardcoded.
 */
const generateToken = (userId) => {
  return jwt.sign(
    { id: userId },          // payload
    process.env.JWT_SECRET,  // secret used to sign
    { expiresIn: process.env.JWT_EXPIRES_IN || "7d" } // expiry
  );
};

module.exports = generateToken;

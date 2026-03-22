/**
 * ─────────────────────────────────────────────────────────────────────────────
 * TODO ROUTES  (routes/todoRoutes.js)
 * ─────────────────────────────────────────────────────────────────────────────
 * ALL todo routes are protected — every request must carry a valid JWT.
 * `protect` is applied at the router level so we don't repeat it per-route.
 *
 * Route table:
 *   GET    /api/todos              → getTodos        (read all)
 *   POST   /api/todos              → createTodo      (create)
 *   DELETE /api/todos/completed    → clearCompleted  (bulk delete)
 *   GET    /api/todos/:id          → getTodoById     (read one)
 *   PUT    /api/todos/:id          → updateTodo      (full update)
 *   PATCH  /api/todos/:id/toggle   → toggleTodo      (flip complete)
 *   DELETE /api/todos/:id          → deleteTodo      (delete one)
 *
 * Note: /completed must be declared BEFORE /:id, otherwise Express would
 * interpret "completed" as an :id parameter value.
 */

const express = require("express");
const router = express.Router();
const {
  createTodo,
  getTodos,
  getTodoById,
  updateTodo,
  toggleTodo,
  deleteTodo,
  clearCompleted,
} = require("../controllers/todoController");
const { protect } = require("../middleware/authMiddleware");

// Apply protect to ALL routes in this router
router.use(protect);

router.route("/")
  .get(getTodos)
  .post(createTodo);

// Specific path BEFORE parameterised path to avoid route collision
router.delete("/completed", clearCompleted);

router.route("/:id")
  .get(getTodoById)
  .put(updateTodo)
  .delete(deleteTodo);

router.patch("/:id/toggle", toggleTodo);

module.exports = router;

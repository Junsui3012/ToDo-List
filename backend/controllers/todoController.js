/**
 * ─────────────────────────────────────────────────────────────────────────────
 * TODO CONTROLLER  (controllers/todoController.js)
 * ─────────────────────────────────────────────────────────────────────────────
 * Implements all CRUD operations for Todo documents.
 *
 * CRUD mapping to HTTP verbs (REST conventions):
 *   Create  → POST   /api/todos
 *   Read    → GET    /api/todos       (all todos for authenticated user)
 *   Read    → GET    /api/todos/:id   (single todo)
 *   Update  → PUT    /api/todos/:id   (full update)
 *   Update  → PATCH  /api/todos/:id/toggle  (toggle complete)
 *   Delete  → DELETE /api/todos/:id
 *
 * Every handler is wrapped in asyncHandler to forward async errors to
 * Express's global error handler (avoids repetitive try/catch blocks).
 *
 * IMPORTANT: Every DB query filters by `user: req.user._id` — this ensures
 * a user can ONLY access their own todos (data isolation / authorisation).
 */

const asyncHandler = require("express-async-handler");
const Todo = require("../models/Todo");
const { validateTodoInput } = require("../utils/validators");
const { sendSuccess, sendError } = require("../utils/responseHandler");

/* ─────────────────────────────────────────────────────────────────────────── */
/*  CREATE  —  POST /api/todos                                                 */
/* ─────────────────────────────────────────────────────────────────────────── */
/**
 * createTodo
 * ----------
 * Creates a new todo for the authenticated user.
 *
 * Steps:
 *   1. Validate input fields.
 *   2. Insert document into MongoDB with the current user's id.
 *   3. Return the created todo with HTTP 201.
 */
const createTodo = asyncHandler(async (req, res) => {
  const { title, priority, dueDate } = req.body;

  // ── 1. Validate ────────────────────────────────────────────────────────────
  const { isValid, errors } = validateTodoInput({ title, priority, dueDate });
  if (!isValid) {
    return sendError(res, 400, "Validation failed", errors);
  }

  // ── 2. Create ──────────────────────────────────────────────────────────────
  // req.user._id comes from the protect middleware after JWT verification
  const todo = await Todo.create({
    title: title.trim(),
    priority: priority || "medium",
    dueDate: dueDate || null,
    user: req.user._id, // ownership assignment
  });

  // ── 3. Respond ─────────────────────────────────────────────────────────────
  return sendSuccess(res, 201, "Todo created", todo);
});

/* ─────────────────────────────────────────────────────────────────────────── */
/*  READ ALL  —  GET /api/todos                                                */
/* ─────────────────────────────────────────────────────────────────────────── */
/**
 * getTodos
 * --------
 * Fetches all todos belonging to the authenticated user with optional:
 *   - filtering by `completed` status (query param ?completed=true/false)
 *   - filtering by `priority`         (query param ?priority=high)
 *   - sorting by `sort` field         (query param ?sort=dueDate or ?sort=-createdAt)
 *
 * Mongoose query building pattern:
 *   We build the `filter` object conditionally, then pass it to .find().
 *   This is cleaner than chaining multiple .where() calls.
 */
const getTodos = asyncHandler(async (req, res) => {
  const { completed, priority, sort } = req.query;

  // ── Build dynamic filter object ────────────────────────────────────────────
  const filter = { user: req.user._id }; // always scoped to current user

  if (completed !== undefined) {
    // Convert string "true"/"false" to boolean
    filter.completed = completed === "true";
  }

  if (priority) {
    filter.priority = priority;
  }

  // ── Build sort string ──────────────────────────────────────────────────────
  // Default: newest first (-createdAt).  Prefix "-" means descending.
  const sortBy = sort || "-createdAt";

  // ── Query ──────────────────────────────────────────────────────────────────
  const todos = await Todo.find(filter).sort(sortBy);

  return sendSuccess(res, 200, "Todos fetched", { count: todos.length, todos });
});

/* ─────────────────────────────────────────────────────────────────────────── */
/*  READ ONE  —  GET /api/todos/:id                                            */
/* ─────────────────────────────────────────────────────────────────────────── */
/**
 * getTodoById
 * -----------
 * Fetches a single todo by its MongoDB ObjectId.
 * The user check prevents one user fetching another user's todo
 * even if they guess the ObjectId.
 */
const getTodoById = asyncHandler(async (req, res) => {
  const todo = await Todo.findOne({
    _id: req.params.id,   // URL param
    user: req.user._id,   // ownership check
  });

  if (!todo) {
    return sendError(res, 404, "Todo not found");
  }

  return sendSuccess(res, 200, "Todo fetched", todo);
});

/* ─────────────────────────────────────────────────────────────────────────── */
/*  UPDATE  —  PUT /api/todos/:id                                              */
/* ─────────────────────────────────────────────────────────────────────────── */
/**
 * updateTodo
 * ----------
 * Updates todo fields (title, priority, dueDate, completed).
 *
 * findOneAndUpdate options:
 *   new: true   → return the UPDATED document (not the pre-update snapshot)
 *   runValidators: true → run Mongoose schema validators on the update fields
 */
const updateTodo = asyncHandler(async (req, res) => {
  const { title, priority, dueDate, completed } = req.body;

  // ── Validate only the provided fields ─────────────────────────────────────
  if (title !== undefined || priority !== undefined || dueDate !== undefined) {
    const { isValid, errors } = validateTodoInput({
      title: title || "placeholder", // avoid false "title required" error on partial update
      priority,
      dueDate,
    });
    if (!isValid) {
      return sendError(res, 400, "Validation failed", errors);
    }
  }

  // ── Build update object with only provided fields ─────────────────────────
  // We don't blindly spread req.body — this prevents injecting unexpected fields
  const updateFields = {};
  if (title !== undefined) updateFields.title = title.trim();
  if (priority !== undefined) updateFields.priority = priority;
  if (dueDate !== undefined) updateFields.dueDate = dueDate || null;
  if (completed !== undefined) updateFields.completed = completed;

  const todo = await Todo.findOneAndUpdate(
    { _id: req.params.id, user: req.user._id }, // filter + ownership
    { $set: updateFields },                       // only update provided fields
    { new: true, runValidators: true }
  );

  if (!todo) {
    return sendError(res, 404, "Todo not found");
  }

  return sendSuccess(res, 200, "Todo updated", todo);
});

/* ─────────────────────────────────────────────────────────────────────────── */
/*  TOGGLE COMPLETE  —  PATCH /api/todos/:id/toggle                            */
/* ─────────────────────────────────────────────────────────────────────────── */
/**
 * toggleTodo
 * ----------
 * Convenience endpoint: flips the `completed` boolean.
 *
 * MongoDB's $bit operator or just read-then-write?
 *   For a simple boolean flip, reading the doc and negating is fine.
 *   findOneAndUpdate with `new:true` returns the updated doc in one round-trip.
 *
 * We use a Mongoose trick: pass a function to the update — but actually
 * we read first, negate, then update for clarity.
 */
const toggleTodo = asyncHandler(async (req, res) => {
  // Find the current state first
  const todo = await Todo.findOne({ _id: req.params.id, user: req.user._id });

  if (!todo) {
    return sendError(res, 404, "Todo not found");
  }

  // Flip the boolean
  const updatedTodo = await Todo.findByIdAndUpdate(
    req.params.id,
    { $set: { completed: !todo.completed } },
    { new: true }
  );

  return sendSuccess(res, 200, `Todo marked as ${updatedTodo.completed ? "completed" : "incomplete"}`, updatedTodo);
});

/* ─────────────────────────────────────────────────────────────────────────── */
/*  DELETE  —  DELETE /api/todos/:id                                           */
/* ─────────────────────────────────────────────────────────────────────────── */
/**
 * deleteTodo
 * ----------
 * Permanently removes a todo document.
 * findOneAndDelete ensures we check ownership atomically.
 *
 * HTTP 200 with a success message is returned (some APIs use 204 No Content,
 * but 200 with a body is friendlier for the frontend to confirm deletion).
 */
const deleteTodo = asyncHandler(async (req, res) => {
  const todo = await Todo.findOneAndDelete({
    _id: req.params.id,
    user: req.user._id,
  });

  if (!todo) {
    return sendError(res, 404, "Todo not found");
  }

  return sendSuccess(res, 200, "Todo deleted successfully", { id: req.params.id });
});

/* ─────────────────────────────────────────────────────────────────────────── */
/*  BULK DELETE COMPLETED  —  DELETE /api/todos/completed                      */
/* ─────────────────────────────────────────────────────────────────────────── */
/**
 * clearCompleted
 * --------------
 * Deletes ALL completed todos for the current user in a single DB call.
 * deleteMany returns { deletedCount: n }.
 */
const clearCompleted = asyncHandler(async (req, res) => {
  const result = await Todo.deleteMany({
    user: req.user._id,
    completed: true,
  });

  return sendSuccess(res, 200, `${result.deletedCount} completed todo(s) deleted`, {
    deletedCount: result.deletedCount,
  });
});

module.exports = {
  createTodo,
  getTodos,
  getTodoById,
  updateTodo,
  toggleTodo,
  deleteTodo,
  clearCompleted,
};

# MERN Stack Deep Dive — Learning Guide

This document explains every major concept and function in this project. It is written to be read alongside the source code — each section matches a file or module you can open.

---

## Table of Contents

1. [The MERN Stack](#1-the-mern-stack)
2. [MongoDB & Mongoose](#2-mongodb--mongoose)
3. [Express.js — Server & Routing](#3-expressjs--server--routing)
4. [Authentication — JWT & bcrypt](#4-authentication--jwt--bcrypt)
5. [Middleware Pattern](#5-middleware-pattern)
6. [CRUD Operations Deep Dive](#6-crud-operations-deep-dive)
7. [React — Component Architecture](#7-react--component-architecture)
8. [React Context & Custom Hooks](#8-react-context--custom-hooks)
9. [Persistent Login — How Sessions Are Remembered](#9-persistent-login--how-sessions-are-remembered)
10. [HTTP & REST API Design](#10-http--rest-api-design)
11. [Docker & Containerization](#11-docker--containerization)
12. [Data Flow — Request Lifecycle](#12-data-flow--request-lifecycle)

---

## 1. The MERN Stack

MERN is an acronym for four technologies that together form a complete full-stack JavaScript application:

```
Browser (React)  ──HTTP──▶  Node.js + Express  ──Mongoose──▶  MongoDB
     (M)ongoDB   (E)xpress   (R)eact   (N)ode.js
```

### Why JavaScript end-to-end?

Using JavaScript on both client and server means:
- One language to learn deeply instead of two
- Data structures (objects, arrays) translate directly between layers
- JSON is native — no serialization friction
- Shared utility functions can live in a common package

### How each layer is responsible

| Layer | Technology | Responsibility |
|-------|-----------|----------------|
| **Database** | MongoDB | Persist data as BSON documents |
| **API Server** | Express + Node.js | Handle HTTP, business logic, auth |
| **UI** | React | Render state as a visual interface |
| **Glue** | Mongoose + Axios | Schema enforcement, HTTP client |

---

## 2. MongoDB & Mongoose

### What is MongoDB?

MongoDB is a **document database** — instead of rows in tables (SQL), it stores **documents** (JSON-like objects) in **collections**.

```
SQL analogy:
  Database  → Database
  Table     → Collection
  Row       → Document
  Column    → Field
```

A Todo document looks like this inside MongoDB:
```json
{
  "_id":       ObjectId("65a1b2c3d4e5f6a7b8c9d0e1"),
  "title":     "Buy groceries",
  "completed": false,
  "priority":  "high",
  "dueDate":   ISODate("2025-01-15"),
  "user":      ObjectId("65a0000000000000000000001"),
  "createdAt": ISODate("2024-12-01T10:00:00Z"),
  "updatedAt": ISODate("2024-12-01T10:00:00Z")
}
```

### Why MongoDB instead of PostgreSQL?

- **Schema flexibility**: fields can differ between documents (useful for prototyping)
- **Native JSON**: documents map 1:1 to JavaScript objects — no ORM impedance mismatch
- **Horizontal scaling**: sharding is built in

### Mongoose — The Schema Layer

Raw MongoDB has no schema enforcement. Mongoose adds:
- **Schemas**: define field types, required fields, defaults, validators
- **Models**: JavaScript class that wraps a collection with CRUD methods
- **Middleware (hooks)**: run code before/after save, update, delete

#### Schema definition (models/User.js)

```js
const userSchema = new mongoose.Schema({
  name:  { type: String, required: true, trim: true },
  email: { type: String, unique: true, lowercase: true },
  password: { type: String, select: false }  // excluded from queries by default
}, { timestamps: true })
```

`timestamps: true` tells Mongoose to automatically add `createdAt` and `updatedAt` fields and update them on every save — you never manage these manually.

#### Pre-save hook (models/User.js)

```js
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next()
  this.password = await bcrypt.hash(this.password, 10)
  next()
})
```

This is a **lifecycle hook**. It fires automatically before `.save()` is called. The `isModified` check is critical: without it, every time you update a user's name, their already-hashed password would be re-hashed — corrupting it.

#### Compound Index (models/Todo.js)

```js
todoSchema.index({ user: 1, createdAt: -1 })
```

An index is a data structure (B-tree) that MongoDB maintains alongside the collection. Without an index, MongoDB must scan every document in the collection to answer a query — O(n). With this index, finding all todos for a user sorted by date is O(log n).

The compound index `{ user: 1, createdAt: -1 }` means: sort by user ascending, then by createdAt descending. This exactly matches the most common query pattern: "give me all todos for user X, newest first."

#### `select: false` on password

```js
password: { type: String, select: false }
```

By default, Mongoose includes all fields in query results. `select: false` excludes the password hash from every `.find()` and `.findOne()` call. When you DO need it (login verification), you explicitly request it:

```js
User.findOne({ email }).select('+password')
```

This is a **defence-in-depth** pattern — even if a bug exposes user objects, the password hash is absent.

---

## 3. Express.js — Server & Routing

### What is Express?

Express is a minimal HTTP framework for Node.js. Node's built-in `http` module is very low-level — you manually parse request bodies, set headers, and handle routing. Express abstracts this into a clean, chainable API.

### The Request-Response Cycle

```
Client sends HTTP request
       ↓
Node.js creates req and res objects
       ↓
Express passes them through the middleware chain
       ↓
A route handler sends a response (res.json(), res.send())
       ↓
Connection closes (or stays alive for keep-alive)
```

### Middleware (server.js)

```js
app.use(cors({ origin: 'http://localhost:5173' }))
app.use(express.json({ limit: '10kb' }))
app.use('/api/auth', authRoutes)
app.use('/api/todos', todoRoutes)
app.use(notFound)
app.use(errorHandler)
```

Each `app.use()` call adds a function to the middleware chain. They execute **in order**. This means:
1. CORS headers are set on every response
2. JSON bodies are parsed before any route handler runs
3. Routes are matched and handled
4. If no route matched, `notFound` fires (404)
5. Any error passed to `next(err)` reaches `errorHandler`

### Route Modularity (routes/todoRoutes.js)

```js
const router = express.Router()
router.use(protect)       // all routes in this router require auth
router.route('/')
  .get(getTodos)
  .post(createTodo)
router.delete('/completed', clearCompleted)
router.route('/:id')
  .get(getTodoById)
  .put(updateTodo)
  .delete(deleteTodo)
router.patch('/:id/toggle', toggleTodo)
```

`express.Router()` creates a **mini-application** — a self-contained set of routes. You mount the whole router at a base path in server.js. This keeps route files focused and independently testable.

**Route order matters**: `/completed` is declared before `/:id`. Express matches routes in declaration order. If `/:id` came first, the string `"completed"` would be captured as an id value — leading to a failed MongoDB ObjectId lookup.

---

## 4. Authentication — JWT & bcrypt

### The Problem Authentication Solves

HTTP is stateless — each request carries no memory of past requests. Without authentication, anyone can call `GET /api/todos` and get your data. We need a way to:
1. Verify who is making a request (authentication)
2. Decide what they're allowed to do (authorization)

### bcrypt — Password Hashing

**Why not store passwords as plain text?**

If your database is compromised, plain-text passwords expose users on every other site they use the same password on. Instead, we store a **hash** — a one-way transformation that cannot be reversed.

**Why not use MD5/SHA256?**

MD5 and SHA256 are fast — deliberately so. An attacker with a GPU can compute billions of MD5 hashes per second, enabling brute-force attacks. bcrypt is deliberately **slow** — its cost factor (10 in our app) makes it take ~100ms per hash. This is imperceptible to a user logging in once, but means an attacker can only try ~10 passwords/second.

**How bcrypt works:**

```
password + random salt → bcrypt(cost=10) → hash string

"$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy"
  └─┘ └─┘ └──────────────────────┘ └──────────────────────────┘
  alg cost      salt (22 chars)           hash (31 chars)
```

The salt is random — two users with the same password get different hashes. This prevents **rainbow table** attacks (pre-computed hash lookups).

```js
// Hashing (at register)
const salt = await bcrypt.genSalt(10)     // generate random salt
const hash = await bcrypt.hash(password, salt)

// Verification (at login)
const isMatch = await bcrypt.compare(candidatePassword, storedHash)
// bcrypt re-extracts the salt from storedHash and re-hashes candidatePassword
```

### JWT — JSON Web Tokens

**The problem with server-side sessions:**

Traditional sessions store a session ID in a cookie and a session object in a server-side store (Redis, memory). This works, but:
- Requires a shared store (complicates horizontal scaling)
- Every request requires a DB lookup to validate the session

**JWTs are stateless:** the token itself contains the information. The server doesn't store anything.

**Anatomy of a JWT:**

```
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9
.eyJpZCI6IjY1YTEiLCJpYXQiOjE3MDAzNTIwMDB9
.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c

[   HEADER (Base64URL)   ].[   PAYLOAD (Base64URL)   ].[   SIGNATURE   ]
```

**Header** (decoded):
```json
{ "alg": "HS256", "typ": "JWT" }
```

**Payload** (decoded — this is public, not encrypted):
```json
{ "id": "65a1...", "iat": 1700352000, "exp": 1700956800 }
```

**Signature:**
```
HMACSHA256(
  base64url(header) + "." + base64url(payload),
  JWT_SECRET
)
```

The server verifies the signature by recomputing it. If the payload was tampered with, the signature won't match — the token is rejected.

**Important**: JWTs are **encoded, not encrypted**. Anyone can decode the payload. Never put sensitive data (passwords, SSNs) in a JWT.

**Token expiry:**

```js
jwt.sign({ id: userId }, JWT_SECRET, { expiresIn: '7d' })
```

The `exp` claim is checked automatically by `jwt.verify()`. After 7 days, the token is rejected — the user must log in again. This limits the damage if a token is stolen.

---

## 5. Middleware Pattern

### What middleware really is

Middleware is any function with the signature `(req, res, next)`. The `next` parameter is a callback — calling it passes control to the next function in the chain.

```
Request ──▶ [cors] ──▶ [json parser] ──▶ [protect] ──▶ [getTodos] ──▶ Response
```

Each function can:
- **Modify** `req` or `res` (add properties, set headers)
- **Terminate** the chain (send a response)
- **Pass control** by calling `next()`
- **Pass an error** by calling `next(error)`

### The protect middleware (middleware/authMiddleware.js)

```js
const protect = asyncHandler(async (req, res, next) => {
  // 1. Extract token from Authorization header
  const token = req.headers.authorization?.split(' ')[1]
  if (!token) return sendError(res, 401, 'No token')

  // 2. Verify token signature and decode payload
  const decoded = jwt.verify(token, process.env.JWT_SECRET)

  // 3. Load user from DB (ensures account still exists)
  req.user = await User.findById(decoded.id).select('-password')
  if (!req.user) return sendError(res, 401, 'User not found')

  // 4. Pass control to the route handler
  next()
})
```

After `protect` runs, every subsequent handler in the chain can safely read `req.user` — it's guaranteed to be a valid, existing user.

### asyncHandler wrapper

```js
const asyncHandler = require('express-async-handler')

const protect = asyncHandler(async (req, res, next) => { ... })
```

Without `asyncHandler`, an unhandled promise rejection in an async route handler crashes the process. `asyncHandler` wraps the function in a try/catch and forwards any caught error to `next(err)`, which then reaches the global `errorHandler` middleware.

This is equivalent to:
```js
const protect = async (req, res, next) => {
  try {
    // ... handler body
  } catch(err) {
    next(err)
  }
}
```

---

## 6. CRUD Operations Deep Dive

CRUD stands for **Create, Read, Update, Delete** — the four fundamental database operations. REST maps these to HTTP verbs:

| CRUD | HTTP Verb | Idempotent? | Meaning |
|------|-----------|-------------|---------|
| Create | POST | No | Creates a new resource |
| Read | GET | Yes | Retrieves without side effects |
| Update | PUT/PATCH | Yes | Modifies existing resource |
| Delete | DELETE | Yes | Removes a resource |

**Idempotent** means calling the operation multiple times has the same effect as calling it once. GET /todos always returns the list regardless of how many times you call it. POST /todos creates a new item each time — not idempotent.

### CREATE — `createTodo` (controllers/todoController.js)

```js
const createTodo = asyncHandler(async (req, res) => {
  const { title, priority, dueDate } = req.body

  // 1. Validate input
  const { isValid, errors } = validateTodoInput({ title, priority, dueDate })
  if (!isValid) return sendError(res, 400, 'Validation failed', errors)

  // 2. Insert into MongoDB
  const todo = await Todo.create({
    title: title.trim(),
    priority: priority || 'medium',
    dueDate: dueDate || null,
    user: req.user._id,        // ownership assignment
  })

  // 3. Return 201 Created with the new document
  return sendSuccess(res, 201, 'Todo created', todo)
})
```

`Todo.create()` is shorthand for `new Todo(data).save()`. Mongoose runs all schema validators and pre-save hooks before inserting.

HTTP **201 Created** signals that a new resource was created — distinct from 200 OK which means the request succeeded but nothing was created.

### READ — `getTodos` with dynamic filtering

```js
const getTodos = asyncHandler(async (req, res) => {
  const { completed, priority, sort } = req.query

  const filter = { user: req.user._id }
  if (completed !== undefined) filter.completed = completed === 'true'
  if (priority) filter.priority = priority

  const sortBy = sort || '-createdAt'  // '-' prefix = descending
  const todos = await Todo.find(filter).sort(sortBy)

  return sendSuccess(res, 200, 'Todos fetched', { count: todos.length, todos })
})
```

The **filter object pattern** is important. Instead of chaining `.where()` calls conditionally, we build a plain object and pass it once to `.find()`. Mongoose translates this to MongoDB's query language:

```js
{ user: ObjectId('...'), completed: false, priority: 'high' }
// becomes:
// db.todos.find({ user: ..., completed: false, priority: 'high' }).sort({ createdAt: -1 })
```

### UPDATE — `updateTodo` with safe field selection

```js
const updateFields = {}
if (title     !== undefined) updateFields.title     = title.trim()
if (priority  !== undefined) updateFields.priority  = priority
if (dueDate   !== undefined) updateFields.dueDate   = dueDate || null
if (completed !== undefined) updateFields.completed = completed

const todo = await Todo.findOneAndUpdate(
  { _id: req.params.id, user: req.user._id },   // filter
  { $set: updateFields },                         // update operator
  { new: true, runValidators: true }              // options
)
```

**Why not `{ ...req.body }`?**

Spreading the entire request body is dangerous. A malicious client could send `{ user: "attackerId" }` to re-assign ownership of the todo. By explicitly picking fields, we control exactly what can be modified.

**`$set` operator**: Only updates the specified fields. Without `$set`, MongoDB would **replace** the entire document (except `_id`) with the update object — all other fields would be lost.

**`new: true`**: By default, `findOneAndUpdate` returns the document as it was *before* the update. `new: true` returns the updated version — what you almost always want on the frontend.

**`runValidators: true`**: Mongoose validators only run automatically on `.save()`. For `findOneAndUpdate`, you must opt in — this ensures `priority: 'invalid'` is still rejected.

### DELETE — `deleteTodo`

```js
const todo = await Todo.findOneAndDelete({
  _id: req.params.id,
  user: req.user._id,    // ownership check in the query itself
})
```

The ownership check (`user: req.user._id`) is embedded in the query filter. This is an **atomic check-and-delete** — if the todo doesn't belong to the user, MongoDB returns `null` in a single operation. There's no window between "check" and "delete" where a race condition could occur.

### TOGGLE — flip a boolean efficiently

```js
const todo = await Todo.findOne({ _id, user })
const updated = await Todo.findByIdAndUpdate(
  id,
  { $set: { completed: !todo.completed } },
  { new: true }
)
```

We read first to know the current value, then negate it. An alternative is MongoDB's `$bit` operator, but this two-step approach is clearer and the performance difference is negligible at this scale.

---

## 7. React — Component Architecture

### Component = function that returns JSX

```jsx
const TodoItem = ({ todo, onToggle, onDelete }) => {
  const [isEditing, setIsEditing] = useState(false)
  return (
    <li className={`todo-item ${todo.completed ? 'todo-item--done' : ''}`}>
      <button onClick={() => onToggle(todo._id)}>✓</button>
      <span>{todo.title}</span>
      <button onClick={() => onDelete(todo._id)}>✕</button>
    </li>
  )
}
```

**Props** are read-only inputs — data flows *down* the component tree via props. **State** is local, mutable data managed by `useState`. When state changes, React re-renders the component and its children.

### Why separate components?

This project has `TodoList → TodoItem`, `TodoList → TodoForm`, `TodoList → TodoFilters`. Each component has one job:

- **TodoList**: orchestrates data fetching and state management
- **TodoItem**: renders a single todo row, handles its own edit mode
- **TodoForm**: manages form values and submission
- **TodoFilters**: renders filter controls, calls back on change

This separation means you can change how the filter UI looks without touching the item rendering logic.

### Lifting State Up

`useTodos` hook lives in `TodoList` and passes handlers down:

```jsx
<TodoItem
  todo={todo}
  onToggle={toggle}     // handler defined in parent
  onEdit={editTodo}     // handler defined in parent
  onDelete={removeTodo} // handler defined in parent
/>
```

`TodoItem` calls `onToggle(id)` — it doesn't know *how* toggling works. This inversion of control keeps `TodoItem` pure and reusable.

---

## 8. React Context & Custom Hooks

### The Problem: Prop Drilling

Without Context, passing `user` and `logout` from the top-level App down to a deeply nested Navbar would require passing them through every intermediate component — even ones that don't use them. This is **prop drilling** and it's painful to maintain.

### React Context — Global State

```
<AuthProvider>          ← stores user, login, logout
  <App>
    <Navbar />          ← needs user, logout  (✓ reads from context)
    <DashboardPage>
      <TodoList />      ← doesn't need user
        <TodoItem />    ← doesn't need user
      </TodoList>
    </DashboardPage>
  </App>
</AuthProvider>
```

Any component inside `<AuthProvider>` can call `useAuth()` to get the current user and auth functions — no props required.

**Creating context:**
```js
const AuthContext = createContext(null)
```

**Providing context:**
```jsx
export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null)
  return (
    <AuthContext.Provider value={{ user, login, logout }}>
      {children}
    </AuthContext.Provider>
  )
}
```

**Consuming context:**
```js
const { user, logout } = useContext(AuthContext)
// or via custom hook:
const { user, logout } = useAuth()
```

### Custom Hooks

A custom hook is a function whose name starts with `use` and that calls other React hooks. It's the idiomatic way to extract stateful logic from components.

**useTodos** extracts all todo state and API calls:

```js
const useTodos = () => {
  const [todos, setTodos] = useState([])
  const [isLoading, setIsLoading] = useState(false)
  const [filter, setFilter] = useState({ sort: '-createdAt' })

  // Re-fetch whenever filter changes
  useEffect(() => { loadTodos(filter) }, [filter])

  const addTodo = useCallback(async (payload) => {
    const data = await todoApi.createTodo(payload)
    setTodos(prev => [data.data, ...prev]) // optimistic prepend
    return data
  }, [])

  return { todos, isLoading, filter, setFilter, addTodo, ... }
}
```

`TodoList` calls `useTodos()` and passes the results down as props. This means `TodoList` has no API calls — it just renders. Swapping the data source (e.g., to a local cache or different API) only requires changing `useTodos`.

**useCallback** memoizes functions — the function reference stays stable across renders unless its dependencies change. This prevents unnecessary re-renders in child components that receive these functions as props.

---

## 9. Persistent Login — How Sessions Are Remembered

This is one of the most important UX features: a user logs in once and stays logged in across page refreshes and browser restarts.

### The Flow

```
1. User logs in → server returns JWT token
         ↓
2. Frontend calls saveAuthData(token, user)
   → localStorage.setItem('authToken', token)
   → localStorage.setItem('authUser', JSON.stringify(user))
         ↓
3. User closes/refreshes browser
         ↓
4. App loads → AuthContext runs bootstrap useEffect
         ↓
5. getToken() reads token from localStorage
         ↓
6. fetchCurrentUser() calls GET /api/auth/me with the stored token
         ↓
7a. Server says OK → setUser(data) → user is silently logged in ✓
7b. Server says 401 → clearAuthData() → redirect to /login ✗
```

### Code walkthrough (context/AuthContext.jsx)

```js
useEffect(() => {
  const bootstrap = async () => {
    const token = getToken()                  // read from localStorage
    if (!token) { setIsLoading(false); return }

    try {
      const data = await fetchCurrentUser()   // verify with server
      setUser(data.data)                      // restore session
    } catch {
      clearAuthData()                         // token invalid — clear it
    } finally {
      setIsLoading(false)
    }
  }
  bootstrap()
}, [])                                        // empty deps = run once on mount
```

**Why verify with the server?**

The stored token *could* be valid in localStorage but invalid on the server (user account deleted, JWT_SECRET rotated, token expired). The `GET /api/auth/me` call is cheap and confirms the token is still accepted.

**The `isLoading` state** is critical for UX. While the bootstrap is running:
- `PrivateRoute` shows a loading spinner instead of redirecting to `/login`
- Without it, users would see a flash of the login page before being redirected to the dashboard

### localStorage vs Cookies

| | localStorage | httpOnly Cookie |
|--|--|--|
| Access from JS | ✓ | ✗ (httpOnly) |
| XSS vulnerable | Yes | No |
| CSRF vulnerable | No | Yes (needs CSRF token) |
| Works with mobile apps | Easily | Requires more setup |
| This project uses | ✓ | |

For most applications, localStorage is acceptable. For high-security apps (banking), `httpOnly` cookies with CSRF protection are preferred.

---

## 10. HTTP & REST API Design

### HTTP Status Codes Used in This Project

| Code | Meaning | When Used |
|------|---------|-----------|
| **200** | OK | Successful read, update, delete, login |
| **201** | Created | Successful resource creation |
| **400** | Bad Request | Validation errors, bad input |
| **401** | Unauthorized | Missing or invalid JWT |
| **403** | Forbidden | Valid JWT but wrong permissions |
| **404** | Not Found | Resource doesn't exist |
| **409** | Conflict | Duplicate email at registration |
| **500** | Server Error | Unexpected exception |

### The Response Envelope Pattern (utils/responseHandler.js)

Every API response shares the same shape:
```json
{
  "success": true,
  "message": "Todos fetched",
  "data": { "count": 3, "todos": [...] }
}
```

Or for errors:
```json
{
  "success": false,
  "message": "Validation failed",
  "errors": ["Title is required", "Priority must be low, medium, or high"]
}
```

The frontend always knows where to find the payload (`data`) and errors (`errors`). Without a consistent envelope, different endpoints might return arrays, raw objects, or error strings — making client-side error handling complex and fragile.

### REST Resource Naming

Resources are **nouns**, not verbs:
```
✓  GET  /api/todos         (get todos)
✗  GET  /api/getTodos      (verb in URL)

✓  DELETE /api/todos/:id   (delete a todo)
✗  POST   /api/deleteTodo  (verb + wrong method)
```

The HTTP verb is already the action — the URL should just identify the resource.

---

## 11. Docker & Containerization

### What is a container?

A container packages an application with all its dependencies (Node.js runtime, npm packages, config files) into a portable unit. On any machine with Docker, `docker compose up` starts the identical environment.

**Without Docker**: "It works on my machine" — different Node versions, OS-specific paths, missing environment variables.

**With Docker**: The container is the environment. It's the same everywhere.

### Dockerfile anatomy (backend/Dockerfile)

```dockerfile
FROM node:20-alpine        # start from official Node image (~170MB)
WORKDIR /app               # all subsequent commands run from /app
COPY package*.json ./      # copy manifests first (layer cache trick)
RUN npm install --omit=dev # install only production deps
COPY . .                   # copy source code
EXPOSE 5000                # document the port (informational)
CMD ["node", "server.js"]  # default command when container starts
```

**The layer cache trick:** Docker builds images in layers. Each instruction is a layer. If a layer's inputs haven't changed, Docker reuses the cached layer. By copying `package.json` before the source code, `npm install` is only re-run when dependencies change — not on every code change.

### Multi-stage build (frontend/Dockerfile)

```dockerfile
# Stage 1: Builder — has node_modules (~200MB)
FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build           # outputs to /app/dist

# Stage 2: Serve — tiny nginx image (~25MB)
FROM nginx:alpine
COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
CMD ["nginx", "-g", "daemon off;"]
```

The final image contains only the compiled static files + nginx. The Node.js runtime, source code, and `node_modules` are discarded. This makes the production image ~25MB instead of ~400MB.

### docker-compose.yml — Service Orchestration

```yaml
services:
  mongo:
    image: mongo:7
    volumes: [mongo-data:/data/db]   # persist data
    healthcheck: ...                  # tell Docker when Mongo is ready

  backend:
    build: ./backend
    depends_on:
      mongo:
        condition: service_healthy   # wait for Mongo health check
    environment:
      MONGO_URI: mongodb://mongo:27017/mern-todo
      # 'mongo' resolves to the mongo container's IP via Docker DNS

  frontend:
    build: ./frontend
    depends_on:
      backend:
        condition: service_healthy
```

**Docker DNS**: Inside the Docker network, containers can reach each other by service name. The backend container connects to MongoDB at `mongodb://mongo:27017` — Docker resolves `mongo` to the MongoDB container's internal IP automatically.

**`depends_on` with health checks**: Without this, the backend might start before MongoDB is accepting connections and crash. The `condition: service_healthy` tells Docker Compose to wait until the Mongo health check passes before starting the backend.

### Named Volume — Data Persistence

```yaml
volumes:
  mongo-data: {}
```

Without a named volume, MongoDB data lives inside the container. `docker compose down` would delete all your data. Named volumes persist on the host machine — `docker compose down` leaves data intact. Only `docker compose down -v` removes the volume.

---

## 12. Data Flow — Request Lifecycle

Let's trace a complete "Create Todo" operation from click to database and back:

### Frontend

```
User types "Buy milk" → clicks "+ Add"
       ↓
TodoForm.handleSubmit(e)
  → calls onSubmit({ title: 'Buy milk', priority: 'medium' })
       ↓
useTodos.addTodo(payload)
  → calls todoApi.createTodo(payload)
       ↓
axiosInstance.post('/todos', { title: 'Buy milk', priority: 'medium' })
  → Request interceptor adds: Authorization: Bearer eyJhbGc...
       ↓
HTTP POST http://localhost:5000/api/todos
  Headers: { Authorization: "Bearer ...", Content-Type: "application/json" }
  Body:    { "title": "Buy milk", "priority": "medium" }
```

### Backend

```
Express receives the request
       ↓
cors middleware adds CORS headers
       ↓
express.json() parses body → req.body = { title: 'Buy milk', ... }
       ↓
router matches POST /api/todos
       ↓
protect middleware:
  1. Extracts token from Authorization header
  2. jwt.verify(token, JWT_SECRET) → decoded = { id: '65a1...' }
  3. User.findById('65a1...') → req.user = { _id, name, email }
  4. next()
       ↓
createTodo controller:
  1. validateTodoInput({ title: 'Buy milk', priority: 'medium' }) → valid
  2. Todo.create({ title, priority, user: req.user._id })
       ↓
Mongoose pre-save: no hooks on Todo, validates schema
       ↓
MongoDB inserts document, returns new document with _id, timestamps
       ↓
sendSuccess(res, 201, 'Todo created', todo)
  → res.status(201).json({ success: true, message: '...', data: { ... } })
```

### Frontend (response)

```
Axios receives HTTP 201 response
  → Response interceptor: status is 201, not 401 → pass through
       ↓
todoApi.createTodo returns res.data
  = { success: true, message: 'Todo created', data: { _id, title, ... } }
       ↓
useTodos.addTodo:
  setTodos(prev => [data.data, ...prev])   // prepend new todo to state
       ↓
React re-renders TodoList → TodoItem appears at top of list
```

This full round-trip typically completes in under 50ms on localhost.

---

## Summary: Key Design Principles Applied

| Principle | Example in Project |
|-----------|-------------------|
| **Single Responsibility** | Each file does one thing: `generateToken.js` only generates tokens |
| **DRY (Don't Repeat Yourself)** | `responseHandler.js` used everywhere instead of `res.json({success:true})` repeated |
| **Separation of Concerns** | Routes declare paths, Controllers contain logic, Models define data shape |
| **Defence in Depth** | Validators → Mongoose validators → DB constraints — multiple layers catch bad data |
| **Fail Fast** | Invalid input rejected at the controller before any DB operations |
| **Data Isolation** | Every query includes `user: req.user._id` — users never see each other's data |
| **Idempotent reads** | GET requests never modify data |
| **Consistent API contract** | Every response has `{ success, message, data }` — frontend has one error handler |

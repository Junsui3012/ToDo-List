# MERN Todo App — Full Stack CRUD with Authentication

A fully functional **MERN stack** (MongoDB · Express · React · Node.js) To-Do application demonstrating:
- Complete **CRUD operations** on todos
- **JWT-based authentication** with persistent login (session survives page refresh)
- Modular codebase organized by responsibility
- **Docker** containerization with `docker-compose`

---

## Project Structure

```
mern-todo/
├── backend/
│   ├── config/           # Database connection
│   ├── controllers/      # Business logic (auth, todos)
│   ├── middleware/        # Auth guard, error handler
│   ├── models/           # Mongoose schemas (User, Todo)
│   ├── routes/           # Express route definitions
│   ├── utils/            # Helpers: token, validators, response formatter
│   ├── server.js         # App entry point
│   └── Dockerfile
├── frontend/
│   ├── src/
│   │   ├── api/          # Axios instance + per-resource API functions
│   │   ├── components/   # React UI components (Auth, Todo, Layout)
│   │   ├── context/      # AuthContext — global auth state
│   │   ├── hooks/        # useTodos, useForm custom hooks
│   │   ├── pages/        # Page-level components
│   │   └── utils/        # storage.js, formatters.js
│   ├── nginx.conf
│   └── Dockerfile
├── docker-compose.yml
└── README.md
```

---

## Prerequisites

| Tool | Version | Purpose |
|------|---------|---------|
| Docker | 20+ | Container runtime |
| Docker Compose | v2+ | Multi-container orchestration |
| Node.js | 20+ | Local development (optional) |
| npm | 9+ | Package manager (optional) |

---

## Quick Start — Docker (Recommended)

### 1. Clone / enter the project directory
```bash
cd mern-todo
```

### 2. (Optional) Customize secrets
```bash
# Copy and edit the environment file
cp backend/.env.example backend/.env
# Edit JWT_SECRET to a strong random string before deploying
```

### 3. Build and start all services
```bash
docker compose up --build
```

Docker will:
1. Pull the `mongo:7` and `node:20-alpine` images
2. Build the backend image (installs Node dependencies)
3. Build the frontend image (runs `vite build`, then packages into nginx)
4. Start all three containers on a shared network

### 4. Open the app
| Service | URL |
|---------|-----|
| Frontend (React) | http://localhost |
| Backend API | http://localhost:5000 |
| MongoDB | mongodb://localhost:27017 |

### 5. Stop everything
```bash
docker compose down          # stop containers (data preserved)
docker compose down -v       # stop + delete MongoDB data volume
```

---

## Local Development (without Docker)

You need MongoDB running locally or a MongoDB Atlas connection string.

### Backend
```bash
cd backend
npm install

# Create .env from the example
cp .env.example .env
# Edit MONGO_URI to point to your local MongoDB:
#   MONGO_URI=mongodb://localhost:27017/mern-todo

npm run dev        # starts with nodemon on port 5000
```

### Frontend
```bash
cd frontend
npm install
npm run dev        # starts Vite dev server on port 5173
```

The Vite dev server proxies `/api` requests to `http://localhost:5000`, so no CORS issues during development.

---

## API Reference

All protected routes require the header:
```
Authorization: Bearer <token>
```

### Auth Endpoints

| Method | URL | Auth | Description |
|--------|-----|------|-------------|
| `POST` | `/api/auth/register` | Public | Create account |
| `POST` | `/api/auth/login` | Public | Sign in, get token |
| `GET`  | `/api/auth/me` | Protected | Get current user |

**Register / Login body:**
```json
{ "name": "Alice", "email": "alice@example.com", "password": "secret123" }
```

**Response envelope:**
```json
{
  "success": true,
  "message": "Logged in successfully",
  "data": {
    "_id": "...",
    "name": "Alice",
    "email": "alice@example.com",
    "token": "<jwt>"
  }
}
```

### Todo Endpoints (all protected)

| Method | URL | Description |
|--------|-----|-------------|
| `GET`    | `/api/todos` | List todos (supports filters) |
| `POST`   | `/api/todos` | Create a todo |
| `GET`    | `/api/todos/:id` | Get one todo |
| `PUT`    | `/api/todos/:id` | Update a todo |
| `PATCH`  | `/api/todos/:id/toggle` | Toggle completed |
| `DELETE` | `/api/todos/:id` | Delete a todo |
| `DELETE` | `/api/todos/completed` | Delete all completed |

**GET /api/todos — Query params:**

| Param | Values | Example |
|-------|--------|---------|
| `completed` | `true` / `false` | `?completed=false` |
| `priority` | `low` / `medium` / `high` | `?priority=high` |
| `sort` | `-createdAt` / `dueDate` | `?sort=dueDate` |

**Create / Update body:**
```json
{
  "title": "Buy groceries",
  "priority": "high",
  "dueDate": "2025-12-31"
}
```

---

## Environment Variables

### Backend (`backend/.env`)

| Variable | Default | Description |
|----------|---------|-------------|
| `PORT` | `5000` | Express server port |
| `MONGO_URI` | `mongodb://mongo:27017/mern-todo` | MongoDB connection string |
| `JWT_SECRET` | *(required)* | Secret key for signing JWTs — **change in production** |
| `JWT_EXPIRES_IN` | `7d` | Token expiry (e.g. `1d`, `7d`, `30d`) |
| `NODE_ENV` | `development` | `development` / `production` |
| `FRONTEND_URL` | `http://localhost:5173` | CORS allowed origin |

### Frontend (`frontend/.env` — optional)

| Variable | Default | Description |
|----------|---------|-------------|
| `VITE_API_URL` | `/api` | Backend base URL (leave as `/api` when using docker/nginx proxy) |

---

## Docker Details

### Services

```
┌─────────────┐      ┌─────────────┐      ┌─────────────┐
│   frontend  │ ───▶ │   backend   │ ───▶ │    mongo    │
│  nginx:80   │      │  node:5000  │      │ mongo:27017 │
└─────────────┘      └─────────────┘      └─────────────┘
         └──────────── mern-todo-network ────────────────┘
```

- **frontend**: nginx serves the Vite-built static files and proxies `/api/*` to backend
- **backend**: Node.js/Express API; waits for mongo health check before starting
- **mongo**: Official MongoDB 7 image; data persisted in named volume `mern-todo-mongo-data`

### Useful Docker commands
```bash
# View logs for a specific service
docker compose logs -f backend

# Rebuild only one service
docker compose up --build backend

# Open a shell inside the backend container
docker compose exec backend sh

# Connect to MongoDB shell
docker compose exec mongo mongosh mern-todo

# List running containers
docker compose ps
```

---

## CRUD Operation Summary

| Operation | HTTP | Endpoint | Frontend trigger |
|-----------|------|----------|-----------------|
| **Create** | POST | `/api/todos` | Submit the Add form |
| **Read All** | GET | `/api/todos` | Dashboard load / filter change |
| **Read One** | GET | `/api/todos/:id` | (internal) |
| **Update** | PUT | `/api/todos/:id` | Click ✎ → edit inline → Save |
| **Toggle** | PATCH | `/api/todos/:id/toggle` | Click the checkbox |
| **Delete** | DELETE | `/api/todos/:id` | Click ✕ button |
| **Bulk Delete** | DELETE | `/api/todos/completed` | "Clear completed" button |

---

## Security Notes

- Passwords are hashed with **bcrypt** (cost factor 10) — never stored as plain text
- JWTs are signed with **HS256** and expire after 7 days by default
- Token is stored in `localStorage` — acceptable for most apps; use `httpOnly` cookies for stricter security
- All todo queries are scoped by `user._id` — users cannot access each other's data
- The `Authorization` header is attached to every request by the Axios interceptor
- On 401 responses, the interceptor automatically clears the token and redirects to `/login`

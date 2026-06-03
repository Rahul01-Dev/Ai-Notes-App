# AI Notes App

A full-stack AI-powered notes application. Write and manage notes, then ask Gemini AI questions about them — all in a clean, dark-themed split-panel UI.

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 18 + Vite + React Router v7 + TanStack Query v5 |
| Backend | Node.js + Express 4 (ESM) |
| Database | PostgreSQL via Prisma 5 |
| Auth | JWT + bcryptjs |
| Validation | Zod |
| AI | Google Gemini 2.5 Flash (`@google/genai`) |

---

## Prerequisites

- **Node.js** 18+
- **PostgreSQL** 14+ running locally (or a hosted instance)
- **Google Gemini API key** — get one free at [aistudio.google.com](https://aistudio.google.com/app/apikey)

---

## Getting Started

### 1. Clone the repository

```bash
git clone <repo-url>
cd ai-notes-app
```

### 2. Set up the server

```bash
cd server
npm install

# Copy the example env file and fill in your values
cp .env.example .env
# Edit .env — set DATABASE_URL, JWT_SECRET, and GEMINI_API_KEY

# Run database migrations
npm run db:migrate

# (Optional) Seed a test user
npm run db:seed

# Start the dev server
npm run dev
```

The API will be available at `http://localhost:5000`.

### 3. Set up the client

```bash
cd client
npm install

# Copy the example env file (defaults are fine for local dev)
cp .env.example .env

# Start the dev server
npm run dev
```

The app will be available at `http://localhost:5173`.

---

## Environment Variables

### Server (`server/.env`)

| Variable | Required | Description |
|---|---|---|
| `DATABASE_URL` | ✅ | PostgreSQL connection string |
| `PORT` | optional | Server port (default: 5000) |
| `NODE_ENV` | optional | `development` or `production` |
| `JWT_SECRET` | ✅ | Secret key for signing JWTs (use a long random string) |
| `JWT_EXPIRES_IN` | optional | Token expiry (default: `7d`) |
| `GEMINI_API_KEY` | ✅ | Google Gemini API key |

### Client (`client/.env`)

| Variable | Required | Description |
|---|---|---|
| `VITE_API_URL` | ✅ | Base URL of the backend (default: `http://localhost:5000`) |

---

## Available Scripts

### Server

| Command | Description |
|---|---|
| `npm run dev` | Start server with hot reload |
| `npm run start` | Start server in production mode |
| `npm run db:generate` | Regenerate Prisma client |
| `npm run db:migrate` | Run pending migrations |
| `npm run db:seed` | Seed a test user |
| `npm run db:studio` | Open Prisma Studio GUI |

### Client

| Command | Description |
|---|---|
| `npm run dev` | Start Vite dev server |
| `npm run build` | Build for production |
| `npm run preview` | Preview production build |

---

## API Endpoints

### Auth

| Method | Endpoint | Description |
|---|---|---|
| POST | `/api/auth/register` | Create account |
| POST | `/api/auth/login` | Login |

### Notes *(require Bearer JWT)*

| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/notes` | List user's notes |
| POST | `/api/notes` | Create a note |
| PUT | `/api/notes/:id` | Update a note |
| DELETE | `/api/notes/:id` | Delete a note |

### AI *(require Bearer JWT)*

| Method | Endpoint | Description |
|---|---|---|
| POST | `/api/notes/:id/ask` | Ask Gemini a question about a note |

---

## Project Structure

```
ai-notes-app/
├── client/
│   ├── src/
│   │   ├── api/          # Axios instance + API helpers
│   │   ├── components/   # ProtectedRoute
│   │   ├── pages/        # Login, Register, Notes (dashboard)
│   │   ├── App.jsx       # Router setup
│   │   └── main.jsx      # Entry point
│   └── package.json
└── server/
    ├── routes/           # auth.js, notes.js, ai.js
    ├── middleware/        # auth.js (JWT verification)
    ├── lib/              # prismaClient.js (singleton)
    ├── prisma/
    │   ├── schema.prisma
    │   ├── seed.js
    │   └── migrations/
    └── index.js          # Express app
```

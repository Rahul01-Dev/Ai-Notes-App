# 🌟 AI Notes App

A full-stack, AI-powered note-taking application designed with a sleek, dark-themed split-panel UI. Write and manage notes seamlessly, and leverage the power of Google Gemini AI to ask questions and gain insights directly from your notes.

![License](https://img.shields.io/badge/license-MIT-blue.svg)
![React](https://img.shields.io/badge/Frontend-React_18-61DAFB?logo=react&logoColor=black)
![NodeJS](https://img.shields.io/badge/Backend-Node.js-339933?logo=node.js&logoColor=white)
![PostgreSQL](https://img.shields.io/badge/Database-PostgreSQL-4169E1?logo=postgresql&logoColor=white)

---

## ✨ Features

- **Modern & Responsive UI**: Built with a beautiful, 3D modern classic design system.
- **Secure Authentication**: Robust JWT-based authentication with encrypted passwords.
- **AI Integration**: Ask Google's Gemini 2.5 Flash questions directly about your notes.
- **Efficient Data Fetching**: Powered by TanStack Query for seamless background updates and caching.
- **Robust API**: RESTful backend using Express.js and Prisma ORM for database interactions.

---

## 🛠️ Tech Stack

### Frontend
- **Framework**: React 18 (Vite)
- **Routing**: React Router v7
- **State & Data Fetching**: TanStack Query v5, Axios
- **Styling**: Vanilla CSS (Custom Design System)

### Backend
- **Environment**: Node.js + Express 4 (ESM)
- **Database**: PostgreSQL via Prisma ORM
- **Authentication**: JWT + bcryptjs
- **Validation**: Zod
- **AI Engine**: Google Gemini API (`@google/genai`)

---

## 🚀 Getting Started

### Prerequisites

Ensure you have the following installed:
- **Node.js** (v18 or higher)
- **PostgreSQL** (v14 or higher) running locally or hosted
- **Google Gemini API Key** — get one for free at [aistudio.google.com](https://aistudio.google.com/app/apikey)

### 1. Clone the Repository

```bash
git clone <repository-url>
cd ai-notes-app
```

### 2. Backend Setup

```bash
cd server
npm install

# Copy the example environment variables file
cp .env.example .env

# Edit .env and configure the following:
# DATABASE_URL, JWT_SECRET, and GEMINI_API_KEY

# Run database migrations to set up the schema
npm run db:migrate

# (Optional) Seed the database with a test user
npm run db:seed

# Start the development server
npm run dev
```

> **Note**: The backend API will be available at `http://localhost:5000`.

### 3. Frontend Setup

Open a new terminal window:

```bash
cd client
npm install

# Copy the example environment variables file
cp .env.example .env

# Start the Vite development server
npm run dev
```

> **Note**: The frontend application will be available at `http://localhost:5173`.

---

## 📜 Available Scripts

### Server Scripts (`/server`)
| Command | Description |
|---|---|
| `npm run dev` | Starts the server in development mode with hot reload |
| `npm run start` | Starts the server in production mode |
| `npm run db:migrate` | Runs pending database migrations |
| `npm run db:studio` | Opens the Prisma Studio GUI to view the database |

### Client Scripts (`/client`)
| Command | Description |
|---|---|
| `npm run dev` | Starts the Vite development server |
| `npm run build` | Builds the frontend for production |

---

## 📂 Project Structure

```text
ai-notes-app/
├── client/                 # React Frontend
│   ├── src/
│   │   ├── api/            # Axios instance and API service handlers
│   │   ├── components/     # Reusable UI components & Protected Routes
│   │   ├── pages/          # Main application views (Home, Login, Register, Notes)
│   │   └── App.jsx         # App routing and React Query setup
├── server/                 # Express Backend
│   ├── routes/             # API Endpoints (auth, notes, ai)
│   ├── middleware/         # Express middlewares (JWT auth verification)
│   ├── lib/                # Shared utilities (Prisma Client, Redis)
│   └── prisma/             # Database schema, migrations, and seeds
└── docker-compose.yml      # Containerized setup
```

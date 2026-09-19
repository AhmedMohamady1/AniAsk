# 🚀 AniAsk Backend API

[![Node.js](https://img.shields.io/badge/Node.js-22+-68a063?style=for-the-badge&logo=node.js&logoColor=white)](https://nodejs.org/)
[![Express.js](https://img.shields.io/badge/Express-5.2+-black?style=for-the-badge&logo=express&logoColor=white)](https://expressjs.com/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5+-3178c6?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-17-4169e1?style=for-the-badge&logo=postgresql&logoColor=white)](https://www.postgresql.org/)
[![Drizzle ORM](https://img.shields.io/badge/Drizzle_ORM-0.45+-C5F74F?style=for-the-badge&logo=drizzle&logoColor=black)](https://orm.drizzle.team/)
[![Docker](https://img.shields.io/badge/Docker-Compose-2496ed?style=for-the-badge&logo=docker&logoColor=white)](https://www.docker.com/)

A type-safe, high-performance RESTful API powering **AniAsk** — handling user authentication, session security with refresh token rotation, and anime list tracking.

---

## 📖 Table of Contents

- [Features](#-features)
- [Tech Stack](#-tech-stack)
- [System Architecture & Security](#-system-architecture--security)
- [Database Schema](#-database-schema)
- [API Reference](#-api-reference)
  - [Authentication Routes](#authentication-routes)
  - [System Routes](#system-routes)
- [Project Structure](#-project-structure)
- [Getting Started](#-getting-started)
  - [Prerequisites](#prerequisites)
  - [Installation & Environment Setup](#installation--environment-setup)
  - [Running the Database with Docker](#running-the-database-with-docker)
  - [Database Migrations & Push](#database-migrations--push)
  - [Running the Application](#running-the-application)
- [Available Scripts](#-available-scripts)
- [Contributing & License](#-contributing--license)

---

## ✨ Features

- **Express 5 Core**: Leverages the latest Express 5 release featuring native async error handling.
- **Strict TypeScript & Schema Validation**: End-to-end typing with runtime validation powered by **Zod**.
- **Secure Authentication & Token Rotation**:
  - Short-lived JWT Access Tokens (e.g., 15 minutes) passed via `Authorization: Bearer <token>` headers.
  - Long-lived Refresh Tokens (e.g., 7 days) persisted in PostgreSQL and stored securely via `httpOnly`, `sameSite: strict` cookies.
  - Refresh token rotation and instant revocation on logout to mitigate token theft.
  - Client metadata tracking (User-Agent, IP address, last used timestamp).
- **PostgreSQL & Drizzle ORM**: Lightweight, fast SQL queries with full type inference and automated migrations via `drizzle-kit`.
- **Anime Watchlist Tracking**: Database schema configured to manage personalized anime tracking (`watching`, `completed`, `on_hold`, `dropped`, `planning`) with user ratings.
- **Dockerized Infrastructure**: Single-command PostgreSQL 17 setup via Docker Compose.
- **Environment-Aware Error Handling**: Comprehensive error middleware with stack traces in development and sanitized error messages in production.

---

## 🛠 Tech Stack

| Category | Technology |
| :--- | :--- |
| **Runtime** | [Node.js](https://nodejs.org/) (v22+) |
| **Package Manager** | [pnpm](https://pnpm.io/) |
| **Framework** | [Express.js](https://expressjs.com/) (v5.x) |
| **Language** | [TypeScript](https://www.typescriptlang.org/) |
| **Database** | [PostgreSQL 17](https://www.postgresql.org/) |
| **ORM & Migrations** | [Drizzle ORM](https://orm.drizzle.team/) & [Drizzle Kit](https://orm.drizzle.team/kit-docs/overview) |
| **Validation** | [Zod](https://zod.dev/) |
| **Authentication** | [jsonwebtoken](https://github.com/auth0/node-jsonwebtoken) & [bcrypt](https://github.com/kelektiv/node.bcrypt.js) |
| **Logging & Security** | [Morgan](https://github.com/expressjs/morgan), [Helmet](https://helmetjs.github.io/), [CORS](https://github.com/expressjs/cors), [Cookie-Parser](https://github.com/expressjs/cookie-parser) |
| **Dev Tooling** | [tsx](https://github.com/privatenumber/tsx) (Fast TypeScript execution & hot reloading) |

---

## 🔐 System Architecture & Security

### Authentication Lifecycle

```mermaid
sequenceDiagram
    autonumber
    actor Client
    participant API as AniAsk API
    participant DB as PostgreSQL DB

    Note over Client,DB: User Login Flow
    Client->>API: POST /auth/login { identifier, password }
    API->>DB: Query user & verify bcrypt password hash
    API->>DB: Insert new refresh token record (IP, User-Agent, Expiry)
    API-->>Client: Set-Cookie: refresh-token (HttpOnly, Strict) + JSON { accessToken }

    Note over Client,DB: Authenticated API Requests
    Client->>API: GET /auth/me (Header: Authorization: Bearer <accessToken>)
    API->>API: Verify Access Token signature
    API-->>Client: 200 OK with User Profile

    Note over Client,DB: Refresh Token Rotation
    Client->>API: POST /auth/refresh (Cookie: refresh-token)
    API->>DB: Validate token existence & check revoked status
    API->>DB: Update lastUsedAt timestamp
    API-->>Client: 201 Created { accessToken }

    Note over Client,DB: Logout Flow
    Client->>API: POST /auth/logout (Bearer Token + Cookie)
    API->>DB: Mark refresh token as revoked
    API-->>Client: Clear-Cookie: refresh-token & 200 OK
```

---

## 🗄 Database Schema

The database is managed with Drizzle ORM schemas in `src/db/schema/`:

### 1. `users` Table
| Column | Type | Constraints | Description |
| :--- | :--- | :--- | :--- |
| `user_id` | `UUID` | Primary Key, Default Random | Unique identifier for the user |
| `username` | `VARCHAR(50)` | Unique, Not Null | Unique username (5–50 chars) |
| `email` | `VARCHAR(50)` | Unique, Not Null | Unique lowercase email address |
| `password` | `TEXT` | Not Null | Salted and hashed password via bcrypt |
| `first_name` | `VARCHAR(30)` | Not Null | User's first name |
| `last_name` | `VARCHAR(30)` | Not Null | User's last name |
| `created_at` | `TIMESTAMP` | Default Now, Not Null | Creation timestamp |
| `updated_at` | `TIMESTAMP` | Auto-update on modification | Last updated timestamp |

### 2. `refresh_tokens` Table
| Column | Type | Constraints | Description |
| :--- | :--- | :--- | :--- |
| `id` | `UUID` | Primary Key, Default Random | Token record ID |
| `user_id` | `UUID` | Foreign Key (`users.user_id`), Cascade Delete | Associated user |
| `token` | `TEXT` | Unique, Not Null | The issued refresh token |
| `revoked` | `BOOLEAN` | Default `false`, Not Null | Invalidation flag |
| `user_agent` | `TEXT` | Nullable | Request client device/browser info |
| `ip_address` | `VARCHAR(45)` | Nullable | Client IP address (IPv4 / IPv6) |
| `last_used_at`| `TIMESTAMP` | Default Now, Not Null | Last time used to issue access token |
| `expires_at` | `TIMESTAMP` | Not Null | Token expiration timestamp |
| `created_at` | `TIMESTAMP` | Default Now, Not Null | Issue timestamp |

### 3. `tracking` Table
| Column | Type | Constraints | Description |
| :--- | :--- | :--- | :--- |
| `id` | `UUID` | Primary Key, Default Random | Entry identifier |
| `user_id` | `UUID` | Foreign Key (`users.user_id`), Cascade Delete | Associated user |
| `anime_id` | `TEXT` | Not Null | AniList anime identifier |
| `status` | `ENUM` | Not Null | `watching`, `completed`, `on_hold`, `dropped`, `planning` |
| `ratings` | `INTEGER` | Nullable | User score / rating |
| `created_at` | `TIMESTAMP` | Default Now, Not Null | Creation timestamp |
| `updated_at` | `TIMESTAMP` | Auto-update on modification | Last modified timestamp |

> **Unique Index**: Composite unique constraint on `(user_id, anime_id)` prevents duplicate list entries for the same anime per user.

---

## 📡 API Reference

**Base URL**: `http://localhost:4000`

### Authentication Routes

#### 1. Register User
- **Method**: `POST`
- **Path**: `/auth/register`
- **Request Body**:
  ```json
  {
    "username": "otakudev",
    "email": "otaku@example.com",
    "password": "StrongPassword123!",
    "firstName": "Levi",
    "lastName": "Ackerman"
  }
  ```
- **Response**: `201 Created`
  ```json
  {
    "message": "user created",
    "user": {
      "userId": "d290f1ee-6c54-4b01-90e6-d701748f0851",
      "username": "otakudev",
      "email": "otaku@example.com",
      "firstName": "Levi",
      "lastName": "Ackerman",
      "createdAt": "2026-09-19T15:00:00.000Z",
      "updatedAt": "2026-09-19T15:00:00.000Z"
    }
  }
  ```

---

#### 2. Login User
- **Method**: `POST`
- **Path**: `/auth/login`
- **Request Body**: (Accepts either `email` or `username` along with `password`)
  ```json
  {
    "email": "otaku@example.com",
    "password": "StrongPassword123!"
  }
  ```
- **Cookies Set**:
  - `refresh-token`: `HttpOnly`, `SameSite=Strict`, `Secure` (in production), valid for configured expiration.
- **Response**: `200 OK`
  ```json
  {
    "success": true,
    "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
  ```

---

#### 3. Get Current User Profile
- **Method**: `GET`
- **Path**: `/auth/me`
- **Headers**:
  ```http
  Authorization: Bearer <accessToken>
  ```
- **Response**: `200 OK`
  ```json
  {
    "userId": "d290f1ee-6c54-4b01-90e6-d701748f0851",
    "username": "otakudev",
    "email": "otaku@example.com",
    "firstName": "Levi",
    "lastName": "Ackerman",
    "createdAt": "2026-09-19T15:00:00.000Z",
    "updatedAt": "2026-09-19T15:00:00.000Z"
  }
  ```

---

#### 4. Refresh Access Token
- **Method**: `POST`
- **Path**: `/auth/refresh`
- **Cookies Required**:
  - `refresh-token`
- **Response**: `201 Created`
  ```json
  {
    "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
  ```

---

#### 5. Logout User
- **Method**: `POST`
- **Path**: `/auth/logout`
- **Headers**:
  ```http
  Authorization: Bearer <accessToken>
  ```
- **Cookies**: `refresh-token`
- **Response**: `200 OK`
  ```json
  {
    "success": true,
    "message": "Logged out successfully"
  }
  ```

---

### System Routes

#### Health Check
- **Method**: `GET`
- **Path**: `/health`
- **Response**: `200 OK`
  ```json
  {
    "status": "Ok",
    "timestamp": "2026-09-19T15:30:00.000Z",
    "uptime": 120.45
  }
  ```

---

## 📂 Project Structure

```
backend/
├── docker-compose.yml        # PostgreSQL 17 container definition
├── drizzle.config.ts         # Drizzle Kit CLI configuration
├── package.json              # Project scripts & dependencies
├── tsconfig.json             # TypeScript configuration
├── .env.example              # Environment variables template
└── src/
    ├── config/
    │   └── configs.ts        # Zod-validated environment config
    ├── controllers/
    │   └── auth.controller.ts# Request handlers for authentication
    ├── db/
    │   ├── index.ts          # Drizzle ORM client initialization
    │   └── schema/
    │       ├── index.ts      # Schema barrel exports
    │       ├── users.ts      # users & refresh_tokens table definitions
    │       └── tracker.ts    # tracking table & status enum definitions
    ├── errors/
    │   └── custom.errors.ts  # CustomError class with status codes
    ├── middlewares/
    │   ├── auth.middleware.ts       # JWT Bearer token verification
    │   ├── errors.middleware.ts     # Global centralized error handler
    │   └── validation.middleware.ts # Zod request validation middleware
    ├── routes/
    │   └── auth.route.ts     # Express router for /auth endpoints
    ├── services/
    │   └── auth.service.ts   # Business logic (hash, verify, DB transactions)
    ├── types/
    │   ├── auth.types.ts     # Token payload & expiration types
    │   ├── express.d.ts      # Express Request type extensions (req.user)
    │   └── user.types.ts     # User & SafeUser data models
    ├── utils/
    │   └── auth.utils.ts     # JWT helpers, bcrypt hashing, cookie expiry logic
    ├── validators/
    │   └── auth.validator.ts # Zod schemas for register & login payloads
    └── server.ts             # Express application entry point & listener
```

---

## 🚀 Getting Started

### Prerequisites

Ensure you have the following installed on your machine:
- [Node.js](https://nodejs.org/) `>= 22.0.0`
- [pnpm](https://pnpm.io/) `>= 9.0.0`
- [Docker](https://www.docker.com/) and [Docker Compose](https://docs.docker.com/compose/)

---

### Installation & Environment Setup

1. **Navigate to the backend directory**:
   ```bash
   cd backend
   ```

2. **Install project dependencies**:
   ```bash
   pnpm install
   ```

3. **Configure environment variables**:
   Copy `.env.example` to create your local `.env`:
   ```bash
   cp .env.example .env
   ```

4. **Verify `.env` configuration**:
   ```env
   PORT=4000
   NODE_ENV=development
   DATABASE_URL="postgresql://postgres:postgres@localhost:5432/aniask"
   ACCESS_TOKEN_SECRET="your_custom_access_secret_min_64_chars"
   REFRESH_TOKEN_SECRET="your_custom_refresh_secret_min_64_chars"
   ACCESS_TOKEN_EXPIRATION="15m"
   REFRESH_TOKEN_EXPIRATION="7d"
   ```

---

### Running the Database with Docker

Start the PostgreSQL 17 database container:

```bash
docker compose up -d
```

To stop the database:
```bash
docker compose down
```

---

### Database Migrations & Push

Synchronize your PostgreSQL database schema with Drizzle ORM:

```bash
# Push schema directly to database (development)
pnpm db:push

# Or generate and run migrations
pnpm db:generate
pnpm db:migrate
```

To launch the interactive **Drizzle Studio** GUI browser:
```bash
pnpm db:studio
```
Open [https://local.drizzle.studio](https://local.drizzle.studio) to view and manage tables visually.

---

### Running the Application

```bash
# Start development server with live reload
pnpm dev

# Build the production bundle
pnpm build

# Start the compiled production server
pnpm start

# Run TypeScript type check
pnpm check
```

The API will be available at:
- **Server**: [http://localhost:4000](http://localhost:4000)
- **Health Check**: [http://localhost:4000/health](http://localhost:4000/health)

---

## 📜 Available Scripts

| Script | Command | Purpose |
| :--- | :--- | :--- |
| `pnpm dev` | `tsx watch src/server.ts` | Runs the server in development mode with automatic reload |
| `pnpm build` | `rimraf dist && tsc` | Cleans the output folder and compiles TypeScript to JavaScript |
| `pnpm start` | `node dist/server.js` | Runs the compiled production code |
| `pnpm check` | `tsc --noEmit` | Type-checks code without emitting output |
| `pnpm db:push` | `pnpm drizzle-kit push` | Applies schema changes directly to PostgreSQL |
| `pnpm db:generate` | `pnpm drizzle-kit generate` | Generates SQL migration files from Drizzle schema |
| `pnpm db:migrate` | `pnpm drizzle-kit migrate` | Executes pending SQL migrations |
| `pnpm db:studio` | `pnpm drizzle-kit studio` | Starts Drizzle Studio web GUI for database inspection |

---

## 🛡 Security & Best Practices

- **Strict Input Validation**: Zod validates all input payloads before reaching controller handlers, throwing structured 400 Bad Request errors.
- **Credential Storage**: Passwords are never stored in plain text and are hashed using **bcrypt** with salted iterations.
- **Fail-Safe Startup**: Zod validates all critical environment variables on startup; if any key is missing or invalid, the process terminates immediately with an error tree.
- **Token Invalidation**: Refresh tokens can be individually revoked in the database, allowing users to log out from specific sessions or terminate compromised sessions immediately.

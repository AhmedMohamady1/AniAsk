# 🚀 AniAsk Backend API

[![Node.js](https://img.shields.io/badge/Node.js-22+-68a063?style=for-the-badge&logo=node.js&logoColor=white)](https://nodejs.org/)
[![Express.js](https://img.shields.io/badge/Express-5.2+-black?style=for-the-badge&logo=express&logoColor=white)](https://expressjs.com/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5+-3178c6?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-17-4169e1?style=for-the-badge&logo=postgresql&logoColor=white)](https://www.postgresql.org/)
[![Drizzle ORM](https://img.shields.io/badge/Drizzle_ORM-0.45+-C5F74F?style=for-the-badge&logo=drizzle&logoColor=black)](https://orm.drizzle.team/)
[![GraphQL](https://img.shields.io/badge/GraphQL-AniList_API-e10098?style=for-the-badge&logo=graphql&logoColor=white)](https://anilist.gitbook.io/anilist-apiv2-docs)
[![Docker](https://img.shields.io/badge/Docker-Compose-2496ed?style=for-the-badge&logo=docker&logoColor=white)](https://www.docker.com/)

A type-safe, high-performance RESTful API powering **AniAsk** — handling user authentication, session security with refresh token rotation, anime list tracking, and real-time anime discovery and search via the AniList GraphQL API.

---

## 📖 Table of Contents

- [Features](#-features)
- [Tech Stack](#-tech-stack)
- [System Architecture & Security](#-system-architecture--security)
- [Database Schema](#-database-schema)
- [API Reference](#-api-reference)
  - [Authentication Routes](#authentication-routes)
  - [Anime Routes](#anime-routes)
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
- **Strict TypeScript & Schema Validation**: End-to-end typing with runtime validation powered by **Zod** across bodies, query params, and route parameters (`res.locals.validated`).
- **AniList GraphQL Integration**: Built-in query service fetching real-time anime feeds from AniList API (trending, popular, top-rated, currently releasing) and keyword search.
- **Rich Media & Character Metadata**: In-depth anime profiles including English/Romaji/Native titles, synopsis, studio credits, episode count, broadcast season/year, character rosters, and Japanese voice actors.
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
| **External Data Source** | [AniList GraphQL API](https://anilist.gitbook.io/anilist-apiv2-docs) (Anime & Manga metadata) |
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

### Anime Routes

Public endpoints for browsing, searching, and inspecting anime media and voice actors powered directly by the AniList GraphQL API. All query and route parameters are validated using Zod via `validate()`.

#### 1. Get Trending Anime
Retrieves currently trending anime sorted by trend rank.

- **Method**: `GET`
- **Path**: `/anime/trending`
- **Query Parameters**:
  - `page` *(optional, integer, min: 1, default: `1`)*: Page number to retrieve.
  - `perPage` *(optional, integer, min: 1, max: 50, default: `10`)*: Number of items per page.
- **Example Request**:
  ```http
  GET /anime/trending?page=1&perPage=10
  ```
- **Response**: `200 OK`
  ```json
  {
    "status": "success",
    "data": {
      "pageInfo": {
        "currentPage": 1,
        "hasNextPage": true,
        "lastPage": 500,
        "perPage": 10,
        "total": 5000
      },
      "media": [
        {
          "id": 16498,
          "title": {
            "romaji": "Shingeki no Kyojin",
            "english": "Attack on Titan",
            "native": "進撃の巨人"
          },
          "coverImage": {
            "large": "https://s4.anilist.co/file/anilistcdn/media/anime/cover/medium/bx16498-m5nnRPzpfiMt.png",
            "extraLarge": "https://s4.anilist.co/file/anilistcdn/media/anime/cover/large/bx16498-m5nnRPzpfiMt.png"
          },
          "bannerImage": "https://s4.anilist.co/file/anilistcdn/media/anime/banner/16498-8jpFfDggPpCe.jpg",
          "averageScore": 85,
          "popularity": 583420,
          "trending": 45,
          "episodes": 25,
          "status": "FINISHED",
          "format": "TV",
          "genres": [
            "Action",
            "Drama",
            "Fantasy",
            "Mystery"
          ],
          "startDate": {
            "year": 2013,
            "month": 4,
            "day": 7
          }
        }
      ]
    }
  }
  ```

---

#### 2. Get Popular Anime
Retrieves all-time most popular anime sorted by subscriber and community popularity count.

- **Method**: `GET`
- **Path**: `/anime/popular`
- **Query Parameters**:
  - `page` *(optional, integer, min: 1, default: `1`)*: Page number.
  - `perPage` *(optional, integer, min: 1, max: 50, default: `10`)*: Items per page (max: 50).
- **Example Request**:
  ```http
  GET /anime/popular?page=1&perPage=10
  ```
- **Response**: `200 OK`
  ```json
  {
    "status": "success",
    "data": {
      "pageInfo": {
        "currentPage": 1,
        "hasNextPage": true,
        "lastPage": 500,
        "perPage": 10,
        "total": 5000
      },
      "media": [ ... ]
    }
  }
  ```

---

#### 3. Get Top-Rated Anime
Retrieves highest rated anime sorted by average community score.

- **Method**: `GET`
- **Path**: `/anime/top-rated`
- **Query Parameters**:
  - `page` *(optional, integer, min: 1, default: `1`)*: Page number.
  - `perPage` *(optional, integer, min: 1, max: 50, default: `10`)*: Items per page (max: 50).
- **Example Request**:
  ```http
  GET /anime/top-rated?page=1&perPage=10
  ```
- **Response**: `200 OK`
  ```json
  {
    "status": "success",
    "data": {
      "pageInfo": {
        "currentPage": 1,
        "hasNextPage": true,
        "lastPage": 500,
        "perPage": 10,
        "total": 5000
      },
      "media": [ ... ]
    }
  }
  ```

---

#### 4. Get Currently Airing Anime
Retrieves currently releasing anime (`status: RELEASING`) sorted by popularity.

- **Method**: `GET`
- **Path**: `/anime/airing`
- **Query Parameters**:
  - `page` *(optional, integer, min: 1, default: `1`)*: Page number.
  - `perPage` *(optional, integer, min: 1, max: 50, default: `10`)*: Items per page (max: 50).
- **Example Request**:
  ```http
  GET /anime/airing?page=1&perPage=10
  ```
- **Response**: `200 OK`
  ```json
  {
    "status": "success",
    "data": {
      "pageInfo": {
        "currentPage": 1,
        "hasNextPage": true,
        "lastPage": 20,
        "perPage": 10,
        "total": 200
      },
      "media": [ ... ]
    }
  }
  ```

---

#### 5. Search Anime
Searches anime titles by natural language keyword or title query.

- **Method**: `GET`
- **Path**: `/anime/search`
- **Query Parameters**:
  - `q` *(required, string, 1–100 characters)*: Search query string.
  - `page` *(optional, integer, min: 1, default: `1`)*: Page number.
  - `perPage` *(optional, integer, min: 1, max: 50, default: `10`)*: Items per page (max: 50).
- **Example Request**:
  ```http
  GET /anime/search?q=frieren&page=1&perPage=5
  ```
- **Response**: `200 OK`
  ```json
  {
    "status": "success",
    "data": {
      "pageInfo": {
        "currentPage": 1,
        "hasNextPage": false,
        "lastPage": 1,
        "perPage": 5,
        "total": 1
      },
      "media": [ ... ]
    }
  }
  ```
- **Error Responses**:
  - `400 Bad Request`: If query parameter `q` is missing, blank, or exceeds 100 characters.
  - `404 Not Found`: If no anime matches the search query:
    ```json
    {
      "status": "fail",
      "message": "No anime found matching the search query"
    }
    ```

---

#### 6. Get Anime Details by ID
Retrieves full details for an anime by its AniList numeric ID, including synopsis, broadcast season/year, production studios, and characters with Japanese voice actors.

- **Method**: `GET`
- **Path**: `/anime/:id`
- **Path Parameters**:
  - `id` *(required, positive integer)*: AniList media identifier.
- **Example Request**:
  ```http
  GET /anime/16498
  ```
- **Response**: `200 OK`
  ```json
  {
    "status": "success",
    "data": {
      "id": 16498,
      "idMal": 16498,
      "title": {
        "romaji": "Shingeki no Kyojin",
        "english": "Attack on Titan",
        "native": "進撃の巨人"
      },
      "description": "Several hundred years ago, humans were nearly exterminated by giants...",
      "type": "ANIME",
      "format": "TV",
      "status": "FINISHED",
      "startDate": { "year": 2013, "month": 4, "day": 7 },
      "endDate": { "year": 2013, "month": 9, "day": 29 },
      "season": "SPRING",
      "seasonYear": 2013,
      "episodes": 25,
      "duration": 24,
      "countryOfOrigin": "JP",
      "isAdult": false,
      "averageScore": 85,
      "meanScore": 86,
      "popularity": 583420,
      "trending": 45,
      "genres": [
        "Action",
        "Drama",
        "Fantasy",
        "Mystery"
      ],
      "coverImage": {
        "large": "https://s4.anilist.co/file/anilistcdn/media/anime/cover/medium/bx16498-m5nnRPzpfiMt.png",
        "extraLarge": "https://s4.anilist.co/file/anilistcdn/media/anime/cover/large/bx16498-m5nnRPzpfiMt.png"
      },
      "bannerImage": "https://s4.anilist.co/file/anilistcdn/media/anime/banner/16498-8jpFfDggPpCe.jpg",
      "studios": {
        "edges": [
          {
            "isMain": true,
            "node": {
              "id": 858,
              "name": "WIT STUDIO"
            }
          }
        ]
      },
      "characters": {
        "edges": [
          {
            "role": "MAIN",
            "node": {
              "id": 40882,
              "name": {
                "full": "Eren Yeager",
                "native": "エレン・イェーガー"
              },
              "image": {
                "large": "https://s4.anilist.co/file/anilistcdn/character/large/b40882-9tQ07f0wN5d8.png"
              }
            },
            "voiceActors": [
              {
                "id": 95101,
                "name": {
                  "full": "Yuuki Kaji",
                  "native": "梶裕貴"
                },
                "image": {
                  "large": "https://s4.anilist.co/file/anilistcdn/staff/large/n95101-hE1p9YV2Z9V4.png"
                }
              }
            ]
          }
        ]
      }
    }
  }
  ```
- **Error Responses**:
  - `400 Bad Request`: If `id` is not a valid positive number.
  - `404 Not Found`: If no anime exists with the specified ID:
    ```json
    {
      "status": "fail",
      "message": "Anime with ID 99999999 not found"
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
    │   ├── anime.controller.ts# Request handlers for AniList anime catalog & search
    │   └── auth.controller.ts # Request handlers for authentication
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
    │   └── validation.middleware.ts # Zod request validation middleware (res.locals.validated)
    ├── routes/
    │   ├── anime.routes.ts   # Express router for /anime endpoints
    │   └── auth.route.ts     # Express router for /auth endpoints
    ├── services/
    │   ├── anime.service.ts  # AniList GraphQL query client & data mapping
    │   └── auth.service.ts   # Business logic (hash, verify, DB transactions)
    ├── types/
    │   ├── anime.types.ts    # AniList media, page, characters & query types
    │   ├── auth.types.ts     # Token payload & expiration types
    │   ├── express.d.ts      # Express Request type extensions (req.user)
    │   └── user.types.ts     # User & SafeUser data models
    ├── utils/
    │   └── auth.utils.ts     # JWT helpers, bcrypt hashing, cookie expiry logic
    ├── validators/
    │   ├── anime.validator.ts# Zod schemas for pagination, search, and anime ID
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
   ANILIST_API_URL="https://graphql.anilist.co"
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

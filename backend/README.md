# 🚀 AniAsk Backend API

[![Node.js](https://img.shields.io/badge/Node.js-22+-68a063?style=for-the-badge&logo=node.js&logoColor=white)](https://nodejs.org/)
[![Express.js](https://img.shields.io/badge/Express-5.2+-black?style=for-the-badge&logo=express&logoColor=white)](https://expressjs.com/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5+-3178c6?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-17-4169e1?style=for-the-badge&logo=postgresql&logoColor=white)](https://www.postgresql.org/)
[![Drizzle ORM](https://img.shields.io/badge/Drizzle_ORM-0.45+-C5F74F?style=for-the-badge&logo=drizzle&logoColor=black)](https://orm.drizzle.team/)
[![GraphQL](https://img.shields.io/badge/GraphQL-AniList_API-e10098?style=for-the-badge&logo=graphql&logoColor=white)](https://anilist.gitbook.io/anilist-apiv2-docs)
[![Nodemailer](https://img.shields.io/badge/Nodemailer-SMTP-007acc?style=for-the-badge&logo=nodemailer&logoColor=white)](https://nodemailer.com/)
[![Docker](https://img.shields.io/badge/Docker-Compose-2496ed?style=for-the-badge&logo=docker&logoColor=white)](https://www.docker.com/)

A type-safe, high-performance RESTful API powering **AniAsk** — handling user authentication, email verification with OTP via SMTP (Nodemailer), session security with refresh token rotation, personalized anime watchlist tracking (with ratings and reviews), and real-time anime discovery and search via the AniList GraphQL API.

---

## 📖 Table of Contents

- [Features](#-features)
- [Tech Stack](#-tech-stack)
- [System Architecture & Security](#-system-architecture--security)
- [Database Schema](#-database-schema)
- [API Reference](#-api-reference)
  - [Authentication Routes](#authentication-routes)
  - [Tracking Routes](#tracking-routes)
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
- **Email Verification & OTP**:
  - Secure 6-digit one-time passcodes (OTP) hashed with bcrypt and persisted with expiration timestamps.
  - Cooldown protection (60s) for resending verification codes and attempt limits (max 5) to prevent brute-force attacks.
  - Mandatory email verification gate preventing unverified accounts from logging in.
  - Automated transactional email delivery powered by **Nodemailer** using SMTP configuration.
- **Personalized Anime Watchlist Tracking**:
  - Full CRUD operations to track anime watching status (`watching`, `completed`, `on_hold`, `dropped`, `planning`).
  - Custom ratings support (0–100 integer scores) and personal text reviews / notes.
  - Composite unique constraints `(user_id, anime_id)` preventing duplicate tracking entries.
  - Paginated user tracking queries automatically enriched with live AniList media metadata.
- **PostgreSQL & Drizzle ORM**: Lightweight, fast SQL queries with full type inference and automated migrations via `drizzle-kit`.
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
| **Email Service** | [Nodemailer](https://nodemailer.com/) (SMTP transactional email dispatch) |
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
    participant Email as SMTP Email Service (Nodemailer)

    Note over Client,Email: User Registration & OTP Verification
    Client->>API: POST /auth/register { username, email, password, firstName, lastName }
    API->>DB: Check if user exists & hash password
    API->>DB: Insert user (emailVerified: false) & generate 6-digit OTP hash
    API->>Email: Send verification OTP email via SMTP
    API-->>Client: 201 Created { message: "user created", user }

    Client->>API: POST /auth/verify-email { email, otp }
    API->>DB: Validate OTP hash, expiry & attempt limits
    API->>DB: Update user (emailVerified: true) & delete verification record
    API-->>Client: 200 OK { status: "success", message: "Email verified successfully" }

    Note over Client,DB: User Login Flow
    Client->>API: POST /auth/login { identifier, password }
    API->>DB: Query user & verify bcrypt password + check emailVerified = true
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
| `email_verified`| `BOOLEAN` | Default `false`, Not Null | Account email verification status |
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

### 3. `email_verifications` Table
| Column | Type | Constraints | Description |
| :--- | :--- | :--- | :--- |
| `id` | `UUID` | Primary Key, Default Random | Verification record ID |
| `user_id` | `UUID` | Foreign Key (`users.user_id`), Cascade Delete | Associated user |
| `otp_hash` | `TEXT` | Not Null | Salted & hashed 6-digit OTP |
| `expires_at` | `TIMESTAMP` | Not Null | OTP expiration timestamp |
| `attempts` | `INTEGER` | Default `0`, Not Null | Failed verification attempt count (max 5) |
| `created_at` | `TIMESTAMP` | Default Now, Not Null | Creation timestamp (used for 60s cooldown) |

### 4. `tracking` Table
| Column | Type | Constraints | Description |
| :--- | :--- | :--- | :--- |
| `id` | `UUID` | Primary Key, Default Random | Entry identifier |
| `user_id` | `UUID` | Foreign Key (`users.user_id`), Cascade Delete | Associated user |
| `anime_id` | `INTEGER` | Not Null | AniList anime identifier |
| `status` | `ENUM` | Not Null | `watching`, `completed`, `on_hold`, `dropped`, `planning` |
| `ratings` | `INTEGER` | Nullable | User score / rating (0–100) |
| `reviews` | `TEXT` | Nullable | Optional user review or personal notes |
| `created_at` | `TIMESTAMP` | Default Now, Not Null | Creation timestamp |
| `updated_at` | `TIMESTAMP` | Auto-update on modification | Last modified timestamp |

> **Unique Index**: Composite unique constraint on `(user_id, anime_id)` prevents duplicate list entries for the same anime per user.

---

## 📡 API Reference

**Base URL**: `http://localhost:4000`

### Authentication Routes

#### 1. Register User
Creates a new user account with `emailVerified: false` and generates a 6-digit verification OTP sent to the user's email address.

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
      "emailVerified": false,
      "createdAt": "2026-09-19T15:00:00.000Z",
      "updatedAt": "2026-09-19T15:00:00.000Z"
    }
  }
  ```

---

#### 2. Verify Email
Verifies a user's account using the 6-digit OTP sent to their email address.

- **Method**: `POST`
- **Path**: `/auth/verify-email`
- **Request Body**:
  ```json
  {
    "email": "otaku@example.com",
    "otp": "123456"
  }
  ```
- **Response**: `200 OK`
  ```json
  {
    "status": "success",
    "message": "Email verified successfully"
  }
  ```
- **Error Responses**:
  - `400 Bad Request`: If OTP format is invalid (must be 6 digits), code is expired, or incorrect:
    ```json
    {
      "status": "fail",
      "message": "Invalid verification code"
    }
    ```
  - `404 Not Found`: If no verification code exists for the account.
  - `409 Conflict`: If the email has already been verified.
  - `429 Too Many Requests`: Exceeded maximum allowable verification attempts (5 attempts):
    ```json
    {
      "status": "fail",
      "message": "Too many verification attempts"
    }
    ```

---

#### 3. Resend Verification Code
Generates and sends a new 6-digit verification OTP to the user's email. Enforces a 60-second cooldown between requests.

- **Method**: `POST`
- **Path**: `/auth/resend-verification`
- **Request Body**:
  ```json
  {
    "email": "otaku@example.com"
  }
  ```
- **Response**: `200 OK`
  ```json
  {
    "status": "success",
    "message": "Verification code sent successfully"
  }
  ```
- **Error Responses**:
  - `404 Not Found`: If no user exists with the provided email.
  - `409 Conflict`: If the user's email is already verified.
  - `429 Too Many Requests`: If requested before the 60-second cooldown expires:
    ```json
    {
      "status": "fail",
      "message": "Please wait before requesting another verification code"
    }
    ```

---

#### 4. Login User
Authenticates a user with email/username and password. Requires the account's email to be verified before allowing login.

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
- **Error Responses**:
  - `401 Unauthorized`: Invalid credentials.
  - `403 Forbidden`: Email address has not been verified:
    ```json
    {
      "status": "fail",
      "message": "Please verify your email before logging in"
    }
    ```

---

#### 5. Get Current User Profile
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
    "emailVerified": true,
    "createdAt": "2026-09-19T15:00:00.000Z",
    "updatedAt": "2026-09-19T15:00:00.000Z"
  }
  ```

---

#### 6. Refresh Access Token
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

#### 7. Logout User
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

### Tracking Routes

Endpoints to manage a user's personal anime watchlist and scores. All tracking endpoints require a valid JWT Bearer access token (`Authorization: Bearer <accessToken>`).

Allowed tracking statuses:
- `watching`
- `completed`
- `on_hold`
- `dropped`
- `planning`

Ratings are integers ranging from `0` to `100`. Reviews are optional text strings for user impressions or personal notes.

#### 1. Add Anime to Tracking List
Adds an anime entry to the authenticated user's tracking list.

- **Method**: `POST`
- **Path**: `/tracking`
- **Headers**:
  ```http
  Authorization: Bearer <accessToken>
  ```
- **Request Body**:
  ```json
  {
    "animeId": 16498,
    "status": "watching",
    "ratings": 90,
    "reviews": "Masterpiece with incredible storytelling and animation."
  }
  ```
- **Response**: `201 Created`
  ```json
  {
    "status": "success",
    "data": [
      {
        "id": "c1f7b9e0-82a1-432d-94c3-1b9195b07802",
        "userId": "d290f1ee-6c54-4b01-90e6-d701748f0851",
        "animeId": 16498,
        "status": "watching",
        "ratings": 90,
        "reviews": "Masterpiece with incredible storytelling and animation.",
        "createdAt": "2026-09-25T18:00:00.000Z",
        "updatedAt": "2026-09-25T18:00:00.000Z"
      }
    ]
  }
  ```
- **Error Responses**:
  - `400 Bad Request`: If `animeId` is invalid, `status` is not an allowed enum value, or `ratings` is outside 0–100.
  - `401 Unauthorized`: Missing or invalid Bearer access token.
  - `409 Conflict`: If the anime is already tracked by the user:
    ```json
    {
      "status": "fail",
      "message": "Tracking entry already exists for this anime"
    }
    ```

---

#### 2. Get User Tracking List
Retrieves the authenticated user's tracked anime list with pagination, optional status filtering, and live AniList metadata for each entry.

- **Method**: `GET`
- **Path**: `/tracking`
- **Headers**:
  ```http
  Authorization: Bearer <accessToken>
  ```
- **Query Parameters**:
  - `status` *(optional, string)*: Filter by status (`watching`, `completed`, `on_hold`, `dropped`, `planning`).
  - `page` *(optional, integer, min: 1, default: `1`)*: Page number.
  - `perPage` *(optional, integer, min: 1, max: 50, default: `50`)*: Items per page.
- **Example Request**:
  ```http
  GET /tracking?status=watching&page=1&perPage=10
  ```
- **Response**: `200 OK`
  ```json
  {
    "status": "success",
    "data": [
      {
        "anime": {
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
        },
        "tracking": {
          "id": "c1f7b9e0-82a1-432d-94c3-1b9195b07802",
          "status": "watching",
          "ratings": 90,
          "reviews": "Masterpiece with incredible storytelling and animation.",
          "createdAt": "2026-09-25T18:00:00.000Z",
          "updatedAt": "2026-09-25T18:00:00.000Z"
        }
      }
    ],
    "pageInfo": {
      "currentPage": 1,
      "perPage": 10,
      "total": 1,
      "lastPage": 1,
      "hasNextPage": false
    }
  }
  ```

---

#### 3. Update Tracking Entry
Updates the status, rating, and/or review for a tracked anime entry by its AniList numeric ID. At least one field (`status`, `ratings`, or `reviews`) must be provided.

- **Method**: `PATCH`
- **Path**: `/tracking/:animeId`
- **Headers**:
  ```http
  Authorization: Bearer <accessToken>
  ```
- **Path Parameters**:
  - `animeId` *(required, positive integer)*: AniList media identifier.
- **Request Body**:
  ```json
  {
    "status": "completed",
    "ratings": 95,
    "reviews": "Updated review: An absolute masterpiece from start to finish."
  }
  ```
- **Response**: `200 OK`
  ```json
  {
    "status": "success",
    "data": {
      "id": "c1f7b9e0-82a1-432d-94c3-1b9195b07802",
      "userId": "d290f1ee-6c54-4b01-90e6-d701748f0851",
      "animeId": 16498,
      "status": "completed",
      "ratings": 95,
      "reviews": "Updated review: An absolute masterpiece from start to finish.",
      "createdAt": "2026-09-25T18:00:00.000Z",
      "updatedAt": "2026-09-25T18:15:00.000Z"
    }
  }
  ```
- **Error Responses**:
  - `400 Bad Request`: If neither `status`, `ratings`, nor `reviews` is provided, or values are invalid.
  - `404 Not Found`: If no tracking record exists for this anime:
    ```json
    {
      "status": "fail",
      "message": "Tracking entry not found"
    }
    ```

---

#### 4. Delete Tracking Entry
Removes an anime from the user's tracking list.

- **Method**: `DELETE`
- **Path**: `/tracking/:animeId`
- **Headers**:
  ```http
  Authorization: Bearer <accessToken>
  ```
- **Path Parameters**:
  - `animeId` *(required, positive integer)*: AniList media identifier.
- **Response**: `200 OK`
  ```json
  {
    "status": "success",
    "message": "Tracking entry deleted successfully"
  }
  ```
- **Error Responses**:
  - `404 Not Found`: If no tracking record exists for this anime:
    ```json
    {
      "status": "fail",
      "message": "Tracking for anime 16498 not found"
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
    │   ├── anime.controller.ts    # Request handlers for AniList anime catalog & search
    │   ├── auth.controller.ts     # Request handlers for authentication & email verification
    │   └── tracking.controller.ts # Request handlers for anime watchlist tracking
    ├── db/
    │   ├── index.ts          # Drizzle ORM client initialization
    │   └── schema/
    │       ├── index.ts              # Schema barrel exports
    │       ├── email-verification.ts # email_verifications table definition
    │       ├── tracker.ts            # tracking table & status enum definitions
    │       └── users.ts              # users & refresh_tokens table definitions
    ├── errors/
    │   └── custom.errors.ts  # CustomError class with status codes
    ├── middlewares/
    │   ├── auth.middleware.ts       # JWT Bearer token verification
    │   ├── errors.middleware.ts     # Global centralized error handler
    │   └── validation.middleware.ts # Zod request validation middleware (res.locals.validated)
    ├── routes/
    │   ├── anime.routes.ts    # Express router for /anime endpoints
    │   ├── auth.route.ts      # Express router for /auth endpoints
    │   └── tracking.routes.ts # Express router for /tracking endpoints
    ├── services/
    │   ├── anime.service.ts              # AniList GraphQL query client & batch lookup
    │   ├── auth.service.ts               # Auth logic (hash, verify, login, DB transactions)
    │   ├── email-verification.service.ts # OTP generation, hashing, attempt limits & cooldown
    │   ├── email.service.ts              # Email delivery via Nodemailer (SMTP)
    │   └── tracking.service.ts           # Anime tracking CRUD business logic
    ├── types/
    │   ├── anime.types.ts    # AniList media, page, characters & query types
    │   ├── auth.types.ts     # Token payload & expiration types
    │   ├── express.d.ts      # Express Request type extensions (req.user)
    │   ├── tracking.types.ts # Anime tracking status enums and types
    │   └── user.types.ts     # User & SafeUser data models
    ├── utils/
    │   └── auth.utils.ts     # JWT helpers, bcrypt hashing, cookie & expiration logic
    ├── validators/
    │   ├── anime.validator.ts    # Zod schemas for pagination, search, and anime ID
    │   ├── auth.validator.ts     # Zod schemas for register, login, & OTP verification
    │   └── tracking.validator.ts # Zod schemas for tracking CRUD requests
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
   OTP_EXPIRATION="10m"
   ACCESS_TOKEN_EXPIRATION="15m"
   REFRESH_TOKEN_EXPIRATION="7d"
   ANILIST_API_URL="https://graphql.anilist.co"
   SMTP_HOST="smtp.example.com"
   SMTP_PORT=587
   SMTP_USER="user@example.com"
   SMTP_PASSWORD="your-smtp-password"
   EMAIL_FROM="noreply@example.com"
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
- **OTP Hashing & Rate Limiting**: OTPs are cryptographically hashed using bcrypt before database storage. Resend requests enforce a 60-second cooldown, and verification attempts are capped at 5 tries to prevent brute-force attacks.
- **Mandatory Email Verification**: Accounts must verify their email address before access/refresh tokens are granted on login.
- **Fail-Safe Startup**: Zod validates all critical environment variables on startup; if any key is missing or invalid, the process terminates immediately with an error tree.
- **Token Invalidation**: Refresh tokens can be individually revoked in the database, allowing users to log out from specific sessions or terminate compromised sessions immediately.
- **Resource Ownership Authorization**: Anime watchlist tracking endpoints enforce user authentication via JWT Bearer tokens, isolating list modifications to each verified user account.

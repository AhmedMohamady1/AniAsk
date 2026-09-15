# AniAsk

A natural-language chatbot agent for querying anime/manga data from the [AniList](https://anilist.co) GraphQL API — ask things like *"what's the highest rated anime this season?"* or *"who are the main voice actors in Steins;Gate?"* and get an answer without writing a query yourself.

## Why this project

Most API wrappers require you to know the exact endpoint/schema to get an answer. AniAsk uses an LLM agent to translate a natural language question into a valid AniList GraphQL query, execute it, and turn the result back into a natural language answer — closer to a text-to-query system than a simple tool-selection agent, since AniList's API is GraphQL rather than REST (the agent has to decide *which fields and relations* to request, not just fill in URL params).

## Tech stack

- **LangChain / LangGraph** — agent orchestration and tool-calling loop
- **Google Gemini** — LLM powering the agent
- **AniList GraphQL API** — public, no auth required for anime/manga search data
- **FastAPI + Uvicorn** — backend API server
- **React + TypeScript + Vite** — frontend chat interface

## Project structure

```
AniAsk/
├── backend/
│   ├── agent/          # LangGraph agent (graph, prompts, state)
│   ├── tools/          # AniList GraphQL query tools (search, details)
│   ├── routers/        # FastAPI route handlers (/api/chat, /api/health)
│   ├── schemas/        # Pydantic request/response models
│   ├── config.py       # Settings loaded from .env
│   └── main.py         # FastAPI app entry point
├── frontend/
│   └── src/            # React + TypeScript chat UI
├── tests/              # pytest tests + evaluation query set
├── .env.example        # required environment variables (copy to .env)
└── requirements.txt    # Python dependencies
```

## Prerequisites

- **Python 3.10+**
- **Node.js 18+** and **npm**
- A **Google AI (Gemini) API key** — get one at [aistudio.google.com](https://aistudio.google.com)

## Setup

### 1. Clone the repo

```bash
git clone https://github.com/AhmedMohamady/AniAsk.git
cd AniAsk
```

### 2. Configure environment variables

```bash
cp .env.example .env
```

Open `.env` and set your API key:

| Variable | Required | Description |
|---|---|---|
| `GOOGLE_API_KEY` | ✅ | Your Google AI (Gemini) API key |
| `ANILIST_API_URL` | ❌ | AniList GraphQL endpoint (defaults to `https://graphql.anilist.co`) |

### 3. Install backend dependencies

```bash
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
```

### 4. Install frontend dependencies

```bash
cd frontend
npm install
cd ..
```

## Running the project

You need **two terminals** — one for the backend and one for the frontend.

### Terminal 1 — Backend (FastAPI)

From the project root:

```bash
source .venv/bin/activate
uvicorn backend.main:app --reload
```

The API server will start at **http://localhost:8000**.
- API docs (Swagger): http://localhost:8000/docs
- Health check: http://localhost:8000/api/health

### Terminal 2 — Frontend (Vite + React)

From the project root:

```bash
cd frontend
npm run dev
```

The frontend dev server will start at **http://localhost:5173**. Open that URL in your browser to start chatting.

## Running tests

```bash
source .venv/bin/activate
pytest
```

## Example queries

See [`tests/test_queries.md`](tests/test_queries.md) for the full evaluation set. Some examples:

- *"What's the highest rated anime this season?"*
- *"Who are the main voice actors in Steins;Gate?"*
- *"Tell me about Attack on Titan"*
- *"What anime are trending right now?"*

# AniAsk

A natural-language AI chatbot for querying anime and manga data from the [AniList](https://anilist.co) GraphQL API — ask things like *"what anime has Studio MAPPA produced?"* or *"who voices Okabe in Steins;Gate?"* and get rich, interactive answers with posters, AniList links, and character/voice actor showcases.

---

## Key Features

- **Natural Language Querying:** Translates natural language questions into precise AniList GraphQL queries without needing to know schemas or IDs.
- **Conversation Awareness:** Remembers previous turns in a conversation so you can ask follow-ups naturally (e.g. *"Who voices Okabe?"* followed by *"What other roles has he done?"*).
- **On-Device Persistence (Privacy-First):** Past conversations and messages are stored 100% locally in your browser using **IndexedDB (via Dexie.js)** — no cloud database required.
- **AI Conversation Summaries:** Automatically generates concise 3–6 word conversation titles via Gemini after your first exchange.
- **Local Search Engine:** Built-in client-side **TF-IDF cosine similarity search** to quickly search and jump to past conversations in real-time.
- **Rich Media & Visual Layouts:**
  - **Anime Media Cards:** Lists (studio works, seasonal lineups, top recommendations) render as sleek cards with poster thumbnails, titles, scores, and descriptions.
  - **Character & Voice Actor Showcase:** Shows paired portraits for characters and their respective Japanese voice actors with role badges.
  - **Interactive AniList Badges:** Direct links to official AniList pages styled as branded pill badges.
  - **Hero Posters:** Single-anime overviews feature high-resolution floating cover posters.

---

## Tech Stack

- **Agent Orchestration:** [LangGraph](https://github.com/langchain-ai/langgraph) / [LangChain](https://github.com/langchain-ai/langchain)
- **LLM:** [Google Gemini](https://ai.google.dev/) (`gemini-2.5-flash`)
- **Data Source:** [AniList GraphQL API](https://anilist.gitbook.io/anilist-apiv2-docs) (public, no authentication required)
- **Backend API:** [FastAPI](https://fastapi.tiangolo.com/) + [Uvicorn](https://www.uvicorn.org/) (Python 3.10+)
- **Frontend UI:** [React 19](https://react.dev/) + [TypeScript](https://www.typescriptlang.org/) + [Vite](https://vitejs.dev/)
- **Client Storage:** [IndexedDB](https://developer.mozilla.org/en-US/docs/Web/API/IndexedDB_API) via [Dexie.js](https://dexie.org/)

---

## Project Structure

```
AniAsk/
├── backend/
│   ├── agent/
│   │   ├── graph.py            # LangGraph state graph and tool-calling loop
│   │   ├── prompts.py          # System prompt with seasonal context and formatting rules
│   │   └── state.py            # AgentState definition
│   ├── tools/
│   │   ├── anilist_client.py   # Shared AniList GraphQL client
│   │   ├── search_anime.py     # Search by title, genre, season, year, score, format
│   │   ├── get_anime_details.py# Deep info: synopsis, characters, voice actors, staff
│   │   └── search_studio.py    # Studio catalog lookup (e.g. MAPPA, KyoAni, ufotable)
│   ├── routers/
│   │   ├── chat.py             # POST /api/chat (agent execution with history)
│   │   └── summarize.py        # POST /api/summarize-title (LLM title generation)
│   ├── schemas/                # Pydantic request/response models
│   ├── config.py               # Application settings loaded from .env
│   └── main.py                 # FastAPI application entry point
├── frontend/
│   ├── src/
│   │   ├── api/                # API client functions (chat, summarize)
│   │   ├── components/         # ChatMessage, ChatInput, Sidebar, WelcomeScreen
│   │   ├── db/                 # Dexie IndexedDB setup & client-side TF-IDF search
│   │   ├── hooks/              # useChat and useConversations lifecycle hooks
│   │   ├── types/              # TypeScript interfaces
│   │   ├── App.tsx             # Main chat interface
│   │   └── index.css           # Styling, design tokens, and media card layouts
│   └── package.json
├── tests/                      # pytest test suite + evaluation queries
├── .env.example                # Template for environment variables
└── requirements.txt            # Python dependencies
```

---

## Prerequisites

- **Python 3.10+**
- **Node.js 18+** and **npm**
- A **Google Gemini API Key** — obtain one free at [aistudio.google.com](https://aistudio.google.com)

---

## Setup & Installation

### 1. Clone the repository

```bash
git clone https://github.com/AhmedMohamady/AniAsk.git
cd AniAsk
```

### 2. Configure environment variables

```bash
cp .env.example .env
```

Open `.env` and enter your Gemini API key:

```env
GOOGLE_API_KEY=your_actual_gemini_api_key_here
GEMINI_MODEL=gemini-2.5-flash
ANILIST_API_URL=https://graphql.anilist.co
```

### 3. Set up the Python virtual environment (Backend)

```bash
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
```

### 4. Install Frontend dependencies

```bash
cd frontend
npm install
cd ..
```

---

## Running the Application

AniAsk requires two terminals running concurrently:

### Terminal 1 — Backend (FastAPI)

From the project root:

```bash
source .venv/bin/activate
uvicorn backend.main:app --reload
```

The API server runs at **http://localhost:8000**:
- Interactive API Docs (Swagger): [http://localhost:8000/docs](http://localhost:8000/docs)
- Health check: [http://localhost:8000/api/health](http://localhost:8000/api/health)

### Terminal 2 — Frontend (Vite + React)

From the project root:

```bash
cd frontend
npm run dev
```

Open **http://localhost:5173** in your browser to use the chat interface.

---

## Running Automated Tests

```bash
source .venv/bin/activate
pytest
```

To run frontend TypeScript validation:

```bash
cd frontend
npx tsc --noEmit
```

---

## Example Queries to Try

- **Studio Showcase:** *"What anime has Studio MAPPA produced?"*
- **Character & Cast:** *"Who voices Okabe in Steins;Gate?"*
- **Contextual Follow-up:** *"What other roles has he done?"*
- **Seasonal Discoveries:** *"What are the top trending anime this season?"*
- **Deep Dive:** *"Tell me about Frieren: Beyond Journey's End"*
- **Genre Search:** *"Find me high-scoring psychological thriller anime from the 2010s"*

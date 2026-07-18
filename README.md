# AniAsk

A natural-language chatbot agent for querying anime/manga data from the [AniList](https://anilist.co) GraphQL API — ask things like *"what's the highest rated anime this season?"* or *"who are the main voice actors in Steins;Gate?"* and get an answer without writing a query yourself.

## Why this project

Most API wrappers require you to know the exact endpoint/schema to get an answer. AniAsk uses an LLM agent to translate a natural language question into a valid AniList GraphQL query, execute it, and turn the result back into a natural language answer — closer to a text-to-query system than a simple tool-selection agent, since AniList's API is GraphQL rather than REST (the agent has to decide *which fields and relations* to request, not just fill in URL params).

## Tech stack

- **LangChain** (or LangGraph) — agent orchestration and tool-calling loop
- **AniList GraphQL API** — public, no auth required for anime/manga search data
- **FastAPI** — backend serving the agent
- **[frontend TBD]** — chat interface

## Planned features

- [ ] Natural language → AniList GraphQL query agent (core MVP)
- [ ] Chat interface for asking questions
- [ ] Personal AniList profile analysis (e.g. "analyze my list" — genre breakdown, completion stats, watch trends) — planned as a v2 feature, will require AniList OAuth2 to read a user's list

## Project structure

```
AniAsk/
├── agent/       # agent orchestration (LangChain/LangGraph agent setup)
├── tools/       # AniList GraphQL query tools the agent can call
├── tests/       # test query set + evaluation notes
├── frontend/    # chat UI
├── .env.example # required environment variables (copy to .env)
└── requirements.txt
```

## Setup

```bash
python -m venv venv
source venv/bin/activate  # or venv\Scripts\activate on Windows
pip install -r requirements.txt
cp .env.example .env  # then fill in your LLM API key
```

## Status

🚧 Early development — core agent + tools in progress.

## Example queries (evaluation set)

See [`tests/test_queries.md`](tests/test_queries.md) for the full list of natural language queries used to test the agent, spanning easy → hard cases.

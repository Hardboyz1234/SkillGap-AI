# SkillGap-AI

An AI-powered career diagnostic app. It takes a person's GitHub profile,
resume, target job, and project experience, analyzes them with Gemini,
and produces:

- A **skill-gap table** — current level vs. required level per skill, with evidence
- A **personalized learning path** — ordered, actionable steps with resources
- A **progress graph** — readiness score over time
- A **chatbot** — answers questions grounded in your specific report

## Structure

```
skillgap-ai/
  backend/    FastAPI + SQLAlchemy (async) + Gemini API — see backend/README.md
  frontend/   React + Vite + Tailwind v4                — see frontend/README.md
```

## Quick start

**1. Backend**
```bash
cd backend
python3 -m venv venv && source venv/bin/activate
pip install -r requirements.txt
cp .env.example .env   # then add your GEMINI_API_KEY
uvicorn app.main:app --reload --port 8000
```

**2. Frontend** (in a second terminal)
```bash
cd frontend
npm install
npm run dev
```

Open http://localhost:5173, create an account, and run your first
diagnostic.

## Tech stack

- **Backend**: FastAPI, async SQLAlchemy (SQLite by default, Postgres-ready),
  JWT auth, Gemini API (`google-genai` SDK), GitHub REST API, pypdf/python-docx
  for resume parsing
- **Frontend**: React 19, Vite, Tailwind CSS v4, React Router, Recharts,
  lucide-react

## What's real vs. what to configure before production

Real and tested end-to-end in this build:
- Auth, database models and relationships, GitHub ingestion, resume
  parsing, the Gemini analysis prompt/parsing pipeline, step tracking,
  progress history, and the chat endpoint.

Before shipping to real users:
- Add a `GITHUB_TOKEN` (see backend README) — unauthenticated GitHub API
  calls are capped at 60/hour per IP.
- Add your real `GEMINI_API_KEY`.
- Swap SQLite for Postgres and add Alembic migrations.
- Set a strong `SECRET_KEY` and lock down CORS to your real domain.
- Put the frontend behind HTTPS and point `vite.config.js`'s dev proxy
  target / `src/api/client.js` base URL at your deployed backend.

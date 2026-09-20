# SkillGap-AI Backend

FastAPI backend: auth, GitHub + resume ingestion, Gemini-powered skill-gap
analysis, learning path tracking, progress history, and a chatbot.

## Setup

```bash
cd backend
python3 -m venv venv
source venv/bin/activate        # Windows: venv\Scripts\activate
pip install -r requirements.txt

cp .env.example .env
# then edit .env and set:
#   GEMINI_API_KEY=AIzaSy...      (required — get one at https://aistudio.google.com/apikey)
#   GITHUB_TOKEN=ghp_...           (optional, raises GitHub rate limit)
```

## Run (development)

```bash
uvicorn app.main:app --reload --port 8000
```

- API base: http://localhost:8000
- Interactive docs (Swagger): http://localhost:8000/docs
- Health check: http://localhost:8000/api/health

The SQLite DB file (`skillgap.db`) is created automatically on first run.

## Key endpoints

| Method | Path                              | Purpose                                   |
|--------|------------------------------------|--------------------------------------------|
| POST   | /api/auth/register                 | Create account, returns JWT                |
| POST   | /api/auth/login                    | Log in, returns JWT                        |
| POST   | /api/analysis (multipart/form-data)| Run a new skill-gap analysis               |
| GET    | /api/analysis                      | List the user's past analyses              |
| GET    | /api/analysis/{id}                 | Get one analysis in full                   |
| PATCH  | /api/analysis/steps/{step_id}      | Mark a learning step in_progress/done      |
| GET    | /api/analysis/progress/history     | Readiness-score time series for the graph  |
| POST   | /api/chat                          | Chat with the assistant about a report     |
| GET    | /api/chat/history                  | Past chat messages                         |

`POST /api/analysis` fields (multipart form):
- `target_job` (required, string)
- `project_description` (optional, string)
- `github_username` (optional, string)
- `resume` (optional, file: .pdf / .docx / .txt)

All protected routes require `Authorization: Bearer <token>` from login/register.

## Production notes

- Swap `DATABASE_URL` to Postgres (`postgresql+asyncpg://...`) — the code
  is already async-SQLAlchemy and DB-agnostic.
- Replace `init_db()` (auto-create-tables) with real Alembic migrations
  before you have production data to protect.
- Set a strong random `SECRET_KEY`.
- Restrict `FRONTEND_ORIGIN` / CORS to your real deployed frontend domain.
- Put a real GitHub token in `GITHUB_TOKEN` — unauthenticated GitHub API
  calls are capped at 60/hour per IP, which you will hit almost immediately
  with real traffic.
- Gemini model names change fairly often (Google deprecates/replaces them
  every few months). If `GEMINI_MODEL` starts returning errors, check
  https://ai.google.dev/gemini-api/docs/models for the current model name
  and update the `.env` value — no code changes needed.

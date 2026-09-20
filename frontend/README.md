# SkillGap-AI Frontend

React + Vite + Tailwind v4 frontend, built to match the Figma design
(dark navy/violet/cyan theme). Talks to the FastAPI backend in `../backend`.

## Setup

```bash
cd frontend
npm install
```

## Run (development)

Make sure the backend is running first (see `../backend/README.md`), then:

```bash
npm run dev
```

- App: http://localhost:5173
- The Vite dev server proxies `/api/*` requests to `http://localhost:8000`
  (configured in `vite.config.js`) — no CORS setup needed in dev.

## Build for production

```bash
npm run build
```

Output goes to `dist/`. Serve it with any static host (Vercel, Netlify,
nginx, etc.) and point it at your deployed backend — update the API base
URL in `src/api/client.js` (currently `/api`, which relies on the dev
proxy or same-origin deployment; for a separate backend host, set it to
the full backend URL or configure a reverse proxy in production too).

## Structure

```
src/
  api/client.js          — axios client + all backend calls
  context/AuthContext.jsx — login/register/logout, JWT persisted in localStorage
  components/            — Sidebar, Logo, ReadinessGauge, Sparkline,
                            SkillGapCard, SkillHighlightsCard,
                            LearningPathCard, RecommendedActionsCard,
                            ChatWidget, ProtectedRoute
  pages/
    AuthPage.jsx          — login / register (not in the original Figma,
                            added because the backend requires auth)
    OnboardingPage.jsx     — "Configure your career profile" form
    DashboardPage.jsx      — "Diagnostic Overview" — assembles all cards
```

## Notes

- Colors, spacing, and copy were matched directly from the provided
  Figma screenshots (onboarding + dashboard + chatbot frames). Design
  tokens live in `src/index.css` under `@theme`.
- `lucide-react` v1 dropped brand/logo icons, so the GitHub mark is a
  small inline SVG in `src/components/GithubMark.jsx` instead.
- The chatbot widget calls `POST /api/chat`, grounding replies in the
  currently-open analysis when one is loaded.

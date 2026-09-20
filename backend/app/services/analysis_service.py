"""
Core AI engine: takes GitHub snapshot + resume text + target job +
project description, sends a structured prompt to Gemini, and parses
back a skill-gap table + learning path in strict JSON.
"""
import json
from typing import Any, Optional

from google import genai
from google.genai import types
from fastapi import HTTPException

from app.config import settings

_client: Optional[genai.Client] = None


def _get_client() -> genai.Client:
    """Lazily constructs the Gemini client. Unlike some SDKs, google-genai's
    Client raises immediately if given an empty API key — constructing it
    eagerly at import time would crash the entire app on startup whenever
    GEMINI_API_KEY isn't set yet, instead of failing cleanly on first use."""
    global _client
    if _client is None:
        if not settings.GEMINI_API_KEY:
            raise HTTPException(
                status_code=500,
                detail="GEMINI_API_KEY is not configured on the server.",
            )
        _client = genai.Client(api_key=settings.GEMINI_API_KEY)
    return _client

SYSTEM_PROMPT = """You are SkillGap-AI's analysis engine, an expert technical \
career coach and hiring manager. You evaluate a candidate's real, evidenced \
skill level from their GitHub activity, resume, and project description, \
compare it against what is genuinely required for their target job, and \
produce an honest, specific, actionable gap analysis.

Rules:
- Base current skill levels on EVIDENCE from the provided GitHub repos, \
languages, and resume text. Do not invent skills not suggested by the data.
- required_level should reflect realistic industry expectations for the \
stated target job (e.g. "Backend Developer", "ML Engineer"), not an \
inflated ideal.
- current_level and required_level are integers 0-100.
- gap = required_level - current_level (can be 0 or negative if candidate \
already exceeds requirement — clamp negative gaps to 0).
- Include both hard/technical skills and relevant soft/process skills \
(e.g. testing, system design, communication) when evidence or the job \
role calls for it.
- priority is "High" if gap >= 40, "Medium" if gap 15-39, "Low" if gap < 15.
- For each skill with gap > 0, generate 2-4 concrete, ordered learning \
steps (step_order starting at 1) with a short title, one-sentence \
description, an estimated_hours integer, and a real, well-known, \
freely-accessible resource_url (official docs, freeCodeCamp, MDN, \
official framework tutorials, etc.) where reasonably possible. If unsure \
of a specific URL, omit resource_url rather than inventing one.
- overall_readiness_score (0-100) is a holistic estimate of how ready \
the candidate is for the target job today.
- summary is 2-4 sentences, direct and encouraging but honest.

Respond with ONLY valid JSON matching this exact schema, no markdown \
fences, no preamble, no trailing text:

{
  "overall_readiness_score": <int>,
  "summary": "<string>",
  "skill_gaps": [
    {
      "skill_name": "<string>",
      "category": "<string>",
      "current_level": <int>,
      "required_level": <int>,
      "gap": <int>,
      "priority": "High|Medium|Low",
      "evidence": "<string, 1-2 sentences citing specific evidence>"
    }
  ],
  "learning_steps": [
    {
      "skill_name": "<string, must match a skill_gaps entry>",
      "step_order": <int>,
      "title": "<string>",
      "description": "<string>",
      "resource_url": "<string or null>",
      "estimated_hours": <int>
    }
  ]
}"""


def _build_user_prompt(
    github_snapshot: Optional[dict[str, Any]],
    resume_text: Optional[str],
    target_job: str,
    project_description: Optional[str],
) -> str:
    parts = [f"TARGET JOB: {target_job}"]

    if project_description:
        parts.append(f"\nCANDIDATE'S PROJECT DESCRIPTION:\n{project_description}")

    if resume_text:
        # Trim to keep prompt size sane; resumes rarely need more than this.
        parts.append(f"\nRESUME TEXT:\n{resume_text[:6000]}")

    if github_snapshot:
        profile = github_snapshot.get("profile", {})
        languages = github_snapshot.get("languages", {})
        repos = github_snapshot.get("repos", [])

        parts.append(f"\nGITHUB PROFILE:\n{json.dumps(profile, indent=2)}")
        parts.append(f"\nGITHUB LANGUAGE BREAKDOWN (bytes of code):\n{json.dumps(languages, indent=2)}")

        repo_lines = []
        for r in repos:
            repo_lines.append(
                f"- {r['name']} ({r.get('primary_language')}, {r.get('stars', 0)} stars)\n"
                f"  Description: {r.get('description')}\n"
                f"  Topics: {r.get('topics')}\n"
                f"  README excerpt: {(r.get('readme_excerpt') or '')[:400]}"
            )
        parts.append("\nGITHUB REPOS:\n" + "\n".join(repo_lines))

    if not resume_text and not github_snapshot:
        parts.append(
            "\n(No resume or GitHub data provided — base the analysis on general "
            "industry requirements for the target job, and note in the summary "
            "that the assessment would be more accurate with resume/GitHub data.)"
        )

    parts.append(
        "\nProduce the skill gap analysis and learning path now, as pure JSON "
        "per the schema."
    )
    return "\n".join(parts)


def _to_int(value: Any, default: int = 0) -> int:
    """Coerces a value from the AI's JSON response to a clean int. Gemini
    normally returns plain integers, but JSON doesn't distinguish int/float,
    and a model can occasionally emit "85" (string) or 85.0 (float) — both
    of which would otherwise crash a strict SQLAlchemy Integer column on
    Postgres (SQLite is lenient and would hide this bug in development)."""
    try:
        return int(round(float(value)))
    except (TypeError, ValueError):
        return default


def _extract_text(response) -> str:
    """Pulls the plain text out of a Gemini response, defensively — a
    response can come back with no candidates (e.g. blocked by safety
    filters) and response.text would raise in that case."""
    text = getattr(response, "text", None)
    if text:
        return text.strip()
    raise HTTPException(
        status_code=502,
        detail="Gemini returned an empty response (it may have been blocked by a safety filter).",
    )


async def run_skill_gap_analysis(
    github_snapshot: Optional[dict[str, Any]],
    resume_text: Optional[str],
    target_job: str,
    project_description: Optional[str],
) -> dict[str, Any]:
    client = _get_client()  # raises a clean 500 if GEMINI_API_KEY isn't set

    user_prompt = _build_user_prompt(
        github_snapshot, resume_text, target_job, project_description
    )

    try:
        response = await client.aio.models.generate_content(
            model=settings.GEMINI_MODEL,
            contents=user_prompt,
            config=types.GenerateContentConfig(
                system_instruction=SYSTEM_PROMPT,
                response_mime_type="application/json",  # forces strict JSON output
                max_output_tokens=4096,
            ),
        )
    except Exception as e:
        raise HTTPException(status_code=502, detail=f"Gemini request failed: {e}")

    raw_text = _extract_text(response)

    # Defensive cleanup in case the model wraps JSON in a code fence anyway
    # (response_mime_type="application/json" should prevent this, but a
    # model can occasionally ignore that).
    if raw_text.startswith("```"):
        raw_text = raw_text.strip("`")
        if raw_text.lower().startswith("json"):
            raw_text = raw_text[4:]
        raw_text = raw_text.strip()

    try:
        parsed = json.loads(raw_text)
    except json.JSONDecodeError as e:
        raise HTTPException(
            status_code=502,
            detail=f"AI analysis returned malformed JSON: {e}",
        )

    # Normalize every numeric field defensively — see _to_int's docstring.
    parsed["overall_readiness_score"] = _to_int(parsed.get("overall_readiness_score"), default=0)

    for sg in parsed.get("skill_gaps", []):
        sg["current_level"] = _to_int(sg.get("current_level"))
        sg["required_level"] = _to_int(sg.get("required_level"))
        # Recompute gap from the now-clean ints rather than trusting the
        # model's own arithmetic, then clamp to 0 per the prompt's rule.
        sg["gap"] = max(0, sg["required_level"] - sg["current_level"])

    for step in parsed.get("learning_steps", []):
        step["step_order"] = _to_int(step.get("step_order"), default=1)
        if step.get("estimated_hours") is not None:
            step["estimated_hours"] = _to_int(step.get("estimated_hours"), default=1)

    return parsed


async def run_chat_reply(
    user_message: str,
    conversation_history: list[dict[str, str]],
    analysis_context: Optional[dict[str, Any]] = None,
) -> str:
    """Chatbot: answers questions about the user's skill-gap report, or
    general career/learning-path questions, with the report as context
    when available."""
    client = _get_client()  # raises a clean 500 if GEMINI_API_KEY isn't set

    system = (
        "You are the SkillGap-AI assistant. You help the user understand their "
        "skill-gap report and learning path, answer questions about specific "
        "skills, suggest resources, and give career guidance. Be concise, "
        "practical, and encouraging. If report context is provided below, "
        "ground your answers in it specifically rather than speaking generically."
    )
    if analysis_context:
        system += f"\n\nUSER'S CURRENT SKILL-GAP REPORT:\n{json.dumps(analysis_context, indent=2)[:6000]}"

    # Gemini uses role "model" where our own history (and Claude) used
    # "assistant" — translate it here rather than changing what's stored.
    contents = [
        types.Content(
            role="model" if m["role"] == "assistant" else "user",
            parts=[types.Part.from_text(text=m["content"])],
        )
        for m in conversation_history
    ]
    contents.append(types.Content(role="user", parts=[types.Part.from_text(text=user_message)]))

    try:
        response = await client.aio.models.generate_content(
            model=settings.GEMINI_MODEL,
            contents=contents,
            config=types.GenerateContentConfig(
                system_instruction=system,
                max_output_tokens=1024,
            ),
        )
    except Exception as e:
        raise HTTPException(status_code=502, detail=f"Gemini request failed: {e}")

    return _extract_text(response)

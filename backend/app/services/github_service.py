"""
Pulls a useful, compact snapshot of a GitHub user's public activity for
the AI analysis step: profile info, top repos, language breakdown, and
README excerpts. Keeps things small enough to fit comfortably in a
Gemini prompt without truncation surprises.
"""
import base64
from typing import Any, Optional

import httpx

from app.config import settings

GITHUB_API = "https://api.github.com"


def _headers() -> dict:
    headers = {"Accept": "application/vnd.github+json"}
    if settings.GITHUB_TOKEN:
        headers["Authorization"] = f"Bearer {settings.GITHUB_TOKEN}"
    return headers


class GitHubServiceError(Exception):
    pass


async def fetch_github_snapshot(username: str, max_repos: int = 8) -> dict[str, Any]:
    """Returns a dict summarizing the user's public GitHub presence.

    Structure:
    {
        "profile": {...},
        "languages": {"Python": 42000, "JavaScript": 18000, ...},
        "repos": [
            {"name", "description", "language", "stars", "topics", "readme_excerpt"}
        ]
    }

    Raises GitHubServiceError (never a raw httpx exception) on any
    not-found, rate-limit, or network failure, so callers only ever need
    to catch one exception type.
    """
    try:
        async with httpx.AsyncClient(timeout=20.0, headers=_headers()) as client:
            profile_resp = await client.get(f"{GITHUB_API}/users/{username}")
            if profile_resp.status_code == 404:
                raise GitHubServiceError(f"GitHub user '{username}' not found.")
            if profile_resp.status_code == 403:
                raise GitHubServiceError(
                    "GitHub API rate limit hit. Add a GITHUB_TOKEN in .env to raise the limit."
                )
            profile_resp.raise_for_status()
            profile = profile_resp.json()

            repos_resp = await client.get(
                f"{GITHUB_API}/users/{username}/repos",
                params={"sort": "updated", "per_page": max_repos, "type": "owner"},
            )
            if repos_resp.status_code == 403:
                raise GitHubServiceError(
                    "GitHub API rate limit hit. Add a GITHUB_TOKEN in .env to raise the limit."
                )
            repos_resp.raise_for_status()
            repos_raw = repos_resp.json()
            if not isinstance(repos_raw, list):
                raise GitHubServiceError(
                    f"Unexpected response from GitHub while listing repos for '{username}'."
                )

            language_totals: dict[str, int] = {}
            repos_summary = []

            for repo in repos_raw:
                repo_name = repo["name"]

                # Per-repo language byte counts (more accurate than the single
                # `language` field, which only shows the dominant language)
                try:
                    lang_resp = await client.get(
                        f"{GITHUB_API}/repos/{username}/{repo_name}/languages"
                    )
                    langs = lang_resp.json() if lang_resp.status_code == 200 else {}
                except httpx.HTTPError:
                    langs = {}

                for lang, byte_count in langs.items():
                    language_totals[lang] = language_totals.get(lang, 0) + byte_count

                readme_excerpt = await _fetch_readme_excerpt(client, username, repo_name)

                repos_summary.append({
                    "name": repo_name,
                    "description": repo.get("description"),
                    "primary_language": repo.get("language"),
                    "stars": repo.get("stargazers_count", 0),
                    "topics": repo.get("topics", []),
                    "readme_excerpt": readme_excerpt,
                    "updated_at": repo.get("updated_at"),
                })

            return {
                "profile": {
                    "login": profile.get("login"),
                    "name": profile.get("name"),
                    "bio": profile.get("bio"),
                    "public_repos": profile.get("public_repos"),
                    "followers": profile.get("followers"),
                    "created_at": profile.get("created_at"),
                },
                "languages": language_totals,
                "repos": repos_summary,
            }
    except GitHubServiceError:
        raise
    except httpx.HTTPStatusError as e:
        raise GitHubServiceError(
            f"GitHub API returned an error ({e.response.status_code}) for '{username}'."
        )
    except httpx.RequestError:
        raise GitHubServiceError(
            "Couldn't reach GitHub right now — check your connection and try again."
        )


async def _fetch_readme_excerpt(
    client: httpx.AsyncClient, username: str, repo_name: str, max_chars: int = 600
) -> Optional[str]:
    try:
        resp = await client.get(f"{GITHUB_API}/repos/{username}/{repo_name}/readme")
        if resp.status_code != 200:
            return None
        data = resp.json()
        content = base64.b64decode(data["content"]).decode("utf-8", errors="ignore")
        return content[:max_chars]
    except Exception:
        return None

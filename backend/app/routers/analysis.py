from datetime import datetime
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.database import get_db
from app.models.db_models import (
    User, Analysis, SkillGap, LearningStep, ProgressSnapshot
)
from app.models.schemas import AnalysisOut, ProgressPointOut, StepStatusUpdate
from app.services.auth_service import get_current_user
from app.services.github_service import fetch_github_snapshot, GitHubServiceError
from app.services.resume_service import extract_resume_text
from app.services.analysis_service import run_skill_gap_analysis

router = APIRouter(prefix="/api/analysis", tags=["analysis"])


@router.post("", response_model=AnalysisOut)
async def create_analysis(
    target_job: str = Form(...),
    project_description: Optional[str] = Form(None),
    github_username: Optional[str] = Form(None),
    resume: Optional[UploadFile] = File(None),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Runs a full skill-gap analysis: fetches GitHub data (if a username
    is given), parses the resume (if uploaded), sends everything to
    Gemini, and persists the resulting report."""

    github_snapshot = None
    if github_username:
        try:
            github_snapshot = await fetch_github_snapshot(github_username)
        except GitHubServiceError as e:
            raise HTTPException(status_code=400, detail=str(e))

    resume_text = None
    if resume is not None:
        resume_text = await extract_resume_text(resume)

    if not github_snapshot and not resume_text and not project_description:
        raise HTTPException(
            status_code=400,
            detail="Provide at least one of: GitHub username, resume, or project description.",
        )

    ai_result = await run_skill_gap_analysis(
        github_snapshot=github_snapshot,
        resume_text=resume_text,
        target_job=target_job,
        project_description=project_description,
    )

    analysis = Analysis(
        user_id=current_user.id,
        target_job=target_job,
        project_description=project_description,
        github_username=github_username,
        resume_text=resume_text,
        github_snapshot=github_snapshot,
        overall_readiness_score=ai_result.get("overall_readiness_score"),
        summary=ai_result.get("summary"),
    )
    db.add(analysis)
    await db.flush()  # get analysis.id before adding children

    for sg in ai_result.get("skill_gaps", []):
        db.add(SkillGap(
            analysis_id=analysis.id,
            skill_name=sg["skill_name"],
            category=sg.get("category"),
            current_level=sg["current_level"],
            required_level=sg["required_level"],
            gap=sg["gap"],
            priority=sg.get("priority"),
            evidence=sg.get("evidence"),
        ))

    for step in ai_result.get("learning_steps", []):
        db.add(LearningStep(
            analysis_id=analysis.id,
            skill_name=step["skill_name"],
            step_order=step["step_order"],
            title=step["title"],
            description=step.get("description"),
            resource_url=step.get("resource_url"),
            estimated_hours=step.get("estimated_hours"),
        ))

    # Record a progress snapshot for the graph
    if analysis.overall_readiness_score is not None:
        db.add(ProgressSnapshot(
            user_id=current_user.id,
            analysis_id=analysis.id,
            readiness_score=analysis.overall_readiness_score,
        ))

    await db.commit()

    result = await db.execute(
        select(Analysis)
        .options(selectinload(Analysis.skill_gaps), selectinload(Analysis.learning_steps))
        .where(Analysis.id == analysis.id)
    )
    return result.scalar_one()


@router.get("", response_model=list[AnalysisOut])
async def list_analyses(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(Analysis)
        .options(selectinload(Analysis.skill_gaps), selectinload(Analysis.learning_steps))
        .where(Analysis.user_id == current_user.id)
        .order_by(Analysis.created_at.desc())
    )
    return result.scalars().all()


@router.get("/{analysis_id}", response_model=AnalysisOut)
async def get_analysis(
    analysis_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(Analysis)
        .options(selectinload(Analysis.skill_gaps), selectinload(Analysis.learning_steps))
        .where(Analysis.id == analysis_id, Analysis.user_id == current_user.id)
    )
    analysis = result.scalar_one_or_none()
    if not analysis:
        raise HTTPException(status_code=404, detail="Analysis not found.")
    return analysis


@router.patch("/steps/{step_id}")
async def update_step_status(
    step_id: str,
    payload: StepStatusUpdate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Mark a learning step in_progress/done. Marking steps done is what
    drives the progress graph between full re-analyses."""
    result = await db.execute(
        select(LearningStep)
        .join(Analysis)
        .where(LearningStep.id == step_id, Analysis.user_id == current_user.id)
    )
    step = result.scalar_one_or_none()
    if not step:
        raise HTTPException(status_code=404, detail="Learning step not found.")

    if payload.status not in ("not_started", "in_progress", "done"):
        raise HTTPException(status_code=400, detail="Invalid status.")

    step.status = payload.status
    step.completed_at = datetime.utcnow() if payload.status == "done" else None
    await db.commit()
    return {"ok": True}


@router.get("/progress/history", response_model=list[ProgressPointOut])
async def progress_history(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Time series of readiness scores, for the progress graph."""
    result = await db.execute(
        select(ProgressSnapshot)
        .where(ProgressSnapshot.user_id == current_user.id)
        .order_by(ProgressSnapshot.recorded_at.asc())
    )
    return result.scalars().all()

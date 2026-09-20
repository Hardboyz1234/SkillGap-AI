from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload
from fastapi import APIRouter, Depends, HTTPException

from app.database import get_db
from app.models.db_models import User, ChatMessage, Analysis
from app.models.schemas import ChatRequest, ChatResponse, ChatMessageOut
from app.services.auth_service import get_current_user
from app.services.analysis_service import run_chat_reply

router = APIRouter(prefix="/api/chat", tags=["chat"])

MAX_HISTORY_MESSAGES = 20  # keep prompt size bounded


@router.post("", response_model=ChatResponse)
async def chat(
    payload: ChatRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    analysis_context = None
    if payload.analysis_id:
        result = await db.execute(
            select(Analysis)
            .options(selectinload(Analysis.skill_gaps), selectinload(Analysis.learning_steps))
            .where(Analysis.id == payload.analysis_id, Analysis.user_id == current_user.id)
        )
        analysis = result.scalar_one_or_none()
        if not analysis:
            raise HTTPException(status_code=404, detail="Analysis not found.")
        analysis_context = {
            "target_job": analysis.target_job,
            "overall_readiness_score": analysis.overall_readiness_score,
            "summary": analysis.summary,
            "skill_gaps": [
                {
                    "skill_name": sg.skill_name,
                    "current_level": sg.current_level,
                    "required_level": sg.required_level,
                    "gap": sg.gap,
                    "priority": sg.priority,
                }
                for sg in analysis.skill_gaps
            ],
        }

    # Pull recent history for conversational context
    history_result = await db.execute(
        select(ChatMessage)
        .where(ChatMessage.user_id == current_user.id)
        .order_by(ChatMessage.created_at.desc())
        .limit(MAX_HISTORY_MESSAGES)
    )
    recent = list(reversed(history_result.scalars().all()))
    conversation_history = [{"role": m.role, "content": m.content} for m in recent]

    reply = await run_chat_reply(payload.message, conversation_history, analysis_context)

    db.add(ChatMessage(user_id=current_user.id, analysis_id=payload.analysis_id,
                        role="user", content=payload.message))
    db.add(ChatMessage(user_id=current_user.id, analysis_id=payload.analysis_id,
                        role="assistant", content=reply))
    await db.commit()

    return ChatResponse(reply=reply)


@router.get("/history", response_model=list[ChatMessageOut])
async def chat_history(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(ChatMessage)
        .where(ChatMessage.user_id == current_user.id)
        .order_by(ChatMessage.created_at.asc())
    )
    return result.scalars().all()

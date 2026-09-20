import uuid
from datetime import datetime

from sqlalchemy import (
    Column, String, Text, Float, Integer, DateTime, ForeignKey, JSON
)
from sqlalchemy.orm import relationship

from app.database import Base


def gen_uuid() -> str:
    return str(uuid.uuid4())


class User(Base):
    __tablename__ = "users"

    id = Column(String, primary_key=True, default=gen_uuid)
    email = Column(String, unique=True, index=True, nullable=False)
    hashed_password = Column(String, nullable=False)
    full_name = Column(String, nullable=True)
    github_username = Column(String, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    analyses = relationship("Analysis", back_populates="user", cascade="all, delete-orphan")
    chat_messages = relationship("ChatMessage", back_populates="user", cascade="all, delete-orphan")
    progress_snapshots = relationship("ProgressSnapshot", back_populates="user", cascade="all, delete-orphan")


class Analysis(Base):
    """One 'run' of the skill-gap engine: a snapshot of GitHub + resume +
    target job + project, and the AI-generated report for it."""
    __tablename__ = "analyses"

    id = Column(String, primary_key=True, default=gen_uuid)
    user_id = Column(String, ForeignKey("users.id"), nullable=False)

    target_job = Column(String, nullable=False)
    project_description = Column(Text, nullable=True)
    github_username = Column(String, nullable=True)

    # Raw inputs kept for audit / re-analysis
    resume_text = Column(Text, nullable=True)
    github_snapshot = Column(JSON, nullable=True)  # languages, repo summaries, etc.

    # AI output
    overall_readiness_score = Column(Float, nullable=True)  # 0-100
    summary = Column(Text, nullable=True)

    created_at = Column(DateTime, default=datetime.utcnow)

    user = relationship("User", back_populates="analyses")
    skill_gaps = relationship("SkillGap", back_populates="analysis", cascade="all, delete-orphan")
    learning_steps = relationship("LearningStep", back_populates="analysis", cascade="all, delete-orphan")


class SkillGap(Base):
    """One row of the skill-gap table shown in the UI."""
    __tablename__ = "skill_gaps"

    id = Column(String, primary_key=True, default=gen_uuid)
    analysis_id = Column(String, ForeignKey("analyses.id"), nullable=False)

    skill_name = Column(String, nullable=False)
    category = Column(String, nullable=True)          # e.g. "Backend", "DevOps", "Soft Skill"
    current_level = Column(Integer, nullable=False)    # 0-100
    required_level = Column(Integer, nullable=False)   # 0-100
    gap = Column(Integer, nullable=False)               # required - current
    priority = Column(String, nullable=True)            # High / Medium / Low
    evidence = Column(Text, nullable=True)               # why the model scored it this way

    analysis = relationship("Analysis", back_populates="skill_gaps")


class LearningStep(Base):
    """One step in the generated learning path for a given skill gap."""
    __tablename__ = "learning_steps"

    id = Column(String, primary_key=True, default=gen_uuid)
    analysis_id = Column(String, ForeignKey("analyses.id"), nullable=False)
    skill_name = Column(String, nullable=False)

    step_order = Column(Integer, nullable=False)
    title = Column(String, nullable=False)
    description = Column(Text, nullable=True)
    resource_url = Column(String, nullable=True)
    estimated_hours = Column(Integer, nullable=True)

    status = Column(String, default="not_started")  # not_started | in_progress | done
    completed_at = Column(DateTime, nullable=True)

    analysis = relationship("Analysis", back_populates="learning_steps")


class ProgressSnapshot(Base):
    """Periodic snapshot of overall readiness, used to draw the progress
    graph over time (re-run analysis, or manually mark steps complete)."""
    __tablename__ = "progress_snapshots"

    id = Column(String, primary_key=True, default=gen_uuid)
    user_id = Column(String, ForeignKey("users.id"), nullable=False)
    analysis_id = Column(String, ForeignKey("analyses.id"), nullable=True)

    readiness_score = Column(Float, nullable=False)
    recorded_at = Column(DateTime, default=datetime.utcnow)

    user = relationship("User", back_populates="progress_snapshots")


class ChatMessage(Base):
    """Chatbot conversation history, scoped per user (and optionally per
    analysis so the bot can reference a specific report)."""
    __tablename__ = "chat_messages"

    id = Column(String, primary_key=True, default=gen_uuid)
    user_id = Column(String, ForeignKey("users.id"), nullable=False)
    analysis_id = Column(String, ForeignKey("analyses.id"), nullable=True)

    role = Column(String, nullable=False)  # "user" | "assistant"
    content = Column(Text, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)

    user = relationship("User", back_populates="chat_messages")

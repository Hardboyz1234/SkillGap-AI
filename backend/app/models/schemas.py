from datetime import datetime
from typing import Optional, List
from pydantic import BaseModel, EmailStr, Field


# ---------- Auth ----------

class UserCreate(BaseModel):
    email: EmailStr
    password: str = Field(min_length=8)
    full_name: Optional[str] = None


class UserLogin(BaseModel):
    email: EmailStr
    password: str


class UserOut(BaseModel):
    id: str
    email: EmailStr
    full_name: Optional[str] = None
    github_username: Optional[str] = None

    class Config:
        from_attributes = True


class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserOut


# ---------- Analysis input ----------

class AnalysisRequest(BaseModel):
    github_username: Optional[str] = None
    target_job: str
    project_description: Optional[str] = None
    # resume_text is populated server-side after parsing the uploaded file;
    # not required directly in the JSON body when a file is uploaded via
    # multipart/form-data instead.


# ---------- Analysis output ----------

class SkillGapOut(BaseModel):
    id: str
    skill_name: str
    category: Optional[str]
    current_level: int
    required_level: int
    gap: int
    priority: Optional[str]
    evidence: Optional[str]

    class Config:
        from_attributes = True


class LearningStepOut(BaseModel):
    id: str
    skill_name: str
    step_order: int
    title: str
    description: Optional[str]
    resource_url: Optional[str]
    estimated_hours: Optional[int]
    status: str

    class Config:
        from_attributes = True


class AnalysisOut(BaseModel):
    id: str
    target_job: str
    project_description: Optional[str]
    github_username: Optional[str]
    overall_readiness_score: Optional[float]
    summary: Optional[str]
    created_at: datetime
    skill_gaps: List[SkillGapOut] = []
    learning_steps: List[LearningStepOut] = []

    class Config:
        from_attributes = True


class ProgressPointOut(BaseModel):
    readiness_score: float
    recorded_at: datetime

    class Config:
        from_attributes = True


class StepStatusUpdate(BaseModel):
    status: str  # not_started | in_progress | done


# ---------- Chat ----------

class ChatRequest(BaseModel):
    message: str
    analysis_id: Optional[str] = None


class ChatMessageOut(BaseModel):
    role: str
    content: str
    created_at: datetime

    class Config:
        from_attributes = True


class ChatResponse(BaseModel):
    reply: str

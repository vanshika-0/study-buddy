
from pydantic import BaseModel, Field


class DailyStudy(BaseModel):
    """One day's accumulated focus time for a user."""

    date: str  # YYYY-MM-DD
    totalSeconds: int = 0


class StudyTimeRequest(BaseModel):
    email: str
    duration: int = Field(gt=0, description="Completed focus-session duration in seconds")


from pydantic import BaseModel


class DailyActivity(BaseModel):
    """Completed scheduled tasks for one calendar day."""

    date: str  # YYYY-MM-DD
    completedTasks: int = 0


class UserActivity(BaseModel):
    """MongoDB shape stored in the activity collection."""

    email: str
    dailyActivity: list[DailyActivity] = []
    currentStreak: int = 0
    longestStreak: int = 0

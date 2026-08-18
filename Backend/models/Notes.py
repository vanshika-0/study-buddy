from pydantic import BaseModel,Field
from uuid import uuid4


class Note(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid4()))
    text: str
    color: str
    pinned: bool = False


class Notes(BaseModel):
    email: str
    notes: list[Note] = []
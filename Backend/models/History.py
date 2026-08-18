from pydantic import BaseModel

class History(BaseModel):
    email:str
    history:list[dict]
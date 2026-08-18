from pydantic import BaseModel
#python build in modeule hai datetime and in tht datetime is a class


class Tests(BaseModel):
    email:str
    score:int

    
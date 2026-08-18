from pydantic import BaseModel
class Dashboard(BaseModel):
    email:str
    studysecond:int=0
    streak:int=0
    topicsCompleted:int=0
    averagescore:float=0
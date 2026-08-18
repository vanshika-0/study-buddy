from pydantic import BaseModel
#python build in modeule hai datetime and in tht datetime is a class
from datetime import datetime

class User(BaseModel):
    username:str
    email:str
    password:str
    
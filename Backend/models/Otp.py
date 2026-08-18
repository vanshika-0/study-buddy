from pydantic import BaseModel
#python build in modeule hai datetime and in tht datetime is a class
from datetime import datetime

class Otp(BaseModel):
    email:str
    
    OTP:str
    expires_at:datetime
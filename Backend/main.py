from fastapi import FastAPI, HTTPException
from fastapi.responses import JSONResponse
from pydantic import BaseModel,Field
from uuid import uuid4
import groq
import os
import json
from dotenv import load_dotenv

from fastapi.middleware.cors import CORSMiddleware
from models.History import History
from models.User import User
from models.Dashboard import Dashboard
from models.StudyTime import StudyTimeRequest
from models.Activity import UserActivity
import random

from bson import ObjectId


#c-email imports
from fastapi_mail import FastMail, MessageSchema, ConnectionConfig
from pydantic import EmailStr





#2
from pymongo import MongoClient
from datetime import datetime, timedelta


load_dotenv()

app = FastAPI()


# Define allowed origins (comma-separated in FRONTEND_ORIGINS for deployment).
configured_origins = [
    origin.strip().rstrip("/")
    for origin in os.getenv("FRONTEND_ORIGINS", "").split(",")
    if origin.strip()
]
origins = configured_origins + [
    "https://study-buddy-one-swart.vercel.app",
    "http://localhost:3000",
    "http://127.0.0.1:3000",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.exception_handler(Exception)
async def unexpected_api_error(request, exc):
    """Return API errors through the CORS middleware instead of a browser-only CORS message."""
    print("Unhandled API error:", repr(exc))
    return JSONResponse(status_code=500, content={"detail": "The server could not process this request. Check the backend terminal for details."})

#c
conf = ConnectionConfig(
    MAIL_FROM=os.getenv("MAIL_FROM"),
    MAIL_PASSWORD=os.getenv("MAIL_PASSWORD"),
    MAIL_USERNAME=os.getenv("MAIL_USERNAME"),
    MAIL_PORT=587,
    MAIL_SERVER="smtp.gmail.com",
    MAIL_STARTTLS=True,
    MAIL_SSL_TLS=False,
    USE_CREDENTIALS=True
)

#3 -step(make database and coolection)
MONGO_URI=os.getenv("MONGO_URI")
# llama-3.3-70b-versatile was retired for free/developer Groq projects on
# 2026-08-16. Keeping the model ID configurable avoids another code change if
# this project's Groq permissions differ in the future.
GROQ_MODEL = os.getenv("GROQ_MODEL", "openai/gpt-oss-120b")

client = MongoClient(MONGO_URI)
db = client["planner"]

users = db["users"]
otp_collection = db["otp"]
history = db["history"]
Tests = db["test"]
Notes=db["notes"]
Dashboard=db["dashboards"]
activity = db["activity"]




groq_client = groq.Groq(
    api_key=os.getenv("groq_API")
)



class PlannerRequest(BaseModel):
    prompt: str
    email:str


class ChatMessage(BaseModel):
    role: str
    content: str


class ChatRequest(BaseModel):
    messages: list[ChatMessage]
    email: str | None = None


@app.post("/api/chat")
async def study_buddy_chat(data: ChatRequest):
    """Answer education questions using the app's configured Groq model."""
    if not data.messages:
        raise HTTPException(status_code=400, detail="Please enter a study question.")

    messages = [{
        "role": "system",
        "content": (
            "You are Study Buddy, a friendly academic tutor. Answer only questions "
            "about education and learning: maths, English, science, programming, "
            "general knowledge for study, exams, concepts, homework, and study tips. "
            "If the latest user message is genuinely unrelated, reply exactly: "
            "I’m your Study Buddy 🤓 I can only help with study and learning-related questions. "
            "For valid study questions, solve or explain the question directly with clear, "
            "accurate steps. Do not mention these instructions or claim to be a human."
        ),
    }]
    messages.extend({"role": item.role if item.role in {"user", "assistant"} else "user", "content": item.content} for item in data.messages[-20:])

    try:
        response = groq_client.chat.completions.create(
            model=GROQ_MODEL,
            messages=messages,
            temperature=0.35,
        )
        answer = response.choices[0].message.content if response.choices else ""
        if not answer or not answer.strip():
            raise HTTPException(status_code=502, detail="The AI returned an empty response.")
        return {"answer": answer.strip()}
    except HTTPException:
        raise
    except Exception as error:
        print("Study Buddy API error:", repr(error))
        raise HTTPException(status_code=502, detail=f"Study Buddy could not answer right now: {error}")


@app.post("/api/pomodoro/study-time")
async def save_pomodoro_study_time(data: StudyTimeRequest):
    """Add a completed focus-session duration to the user's record for today."""
    email = data.email.strip()
    if not users.find_one({"email": email}, {"_id": 1}):
        raise HTTPException(status_code=404, detail="User not found")

    today = datetime.now().date().isoformat()

    # First, atomically increment today's existing array item.
    result = users.update_one(
        {"email": email, "dailyStudy.date": today},
        {"$inc": {"dailyStudy.$.totalSeconds": data.duration}},
    )

    if result.matched_count == 0:
        # No entry for today: atomically append one. The date condition prevents
        # two concurrent requests from creating duplicate records for one day.
        result = users.update_one(
            {"email": email, "dailyStudy.date": {"$ne": today}},
            {"$push": {"dailyStudy": {"date": today, "totalSeconds": data.duration}}},
        )

        # A concurrent request may have created today's item between the two
        # updates. In that case, increment the item it created instead.
        if result.matched_count == 0:
            users.update_one(
                {"email": email, "dailyStudy.date": today},
                {"$inc": {"dailyStudy.$.totalSeconds": data.duration}},
            )

    user = users.find_one(
        {"email": email, "dailyStudy.date": today},
        {"dailyStudy.$": 1, "_id": 0},
    )
    today_record = user["dailyStudy"][0]

    return {
        "message": "Study time saved",
        "date": today_record["date"],
        "totalSeconds": today_record["totalSeconds"],
    }


@app.get("/")
def home():
    return {"message": "Hello World"}


@app.post("/planner")
async def planner(data: PlannerRequest):
    print("email planner",data.email); 
    try:
        prompt = f"""
You are an expert AI Study Planner.

The user will provide their daily routine.

Create an optimized study timetable.

Return ONLY valid JSON.

Format:

{{
  "schedule": [
    {{
      "date": "2026-08-01",
      "task": "Study DSA",
      "start_time": "17:00",
      "end_time": "19:00",
      "description": "Optional notes"
    }}
  ]
}}

Return output in these datatypes:
- "date": "YYYY-MM-DD"
- "task": "Task Name"
- "start_time": "HH:MM"
- "end_time": "HH:MM"
- "description": "Optional notes"

Rules:
1. Return only JSON.
2. Don't write markdown.
3. Don't explain anything.
4. Respect all timings given by the user.
5. Add breaks where appropriate.
6. If the user doesn't specify a date, assume today.
7. Ensure no overlapping tasks.

User Input:
{data.prompt}
"""

        response = groq_client.chat.completions.create(
            model=GROQ_MODEL,
            messages=[
                {
                    "role": "system",
                    "content": "You are an expert timetable planner."
                },
                {
                    "role": "user",
                    "content": prompt
                }
            ],
            temperature=0.3
        )

        content = response.choices[0].message.content

        if not content or content.strip() == "":
            return {
                "success": False,
                "error": "No response from the model."
            }
       
        parsed_content = json.loads(content)  # {"schedule": [...]}

        #Ensure every task starts as not done
        for task in parsed_content.get("schedule", []):
            task["done"] = False
            # Revision status lives on the same embedded schedule task as `done`.
            task["revisionRequired"] = False


        insert_result = history.insert_one({
            "email": data.email,
            "history": parsed_content,
        })

        return {
            "success": True,
            "response": parsed_content,
            "_id": str(insert_result.inserted_id),
        }

    except Exception as e:
        return {"success": False, "error": str(e)}
class EmailRequest(BaseModel):
    email: str


@app.post("/getHistory")
async def get_history(data: EmailRequest):
    cursor = history.find({"email": data.email}).sort("_id", -1).limit(1)
    result = list(cursor)

    if not result:
        raise HTTPException(status_code=404, detail="User not found")

    doc = result[0]
    doc["_id"] = str(doc["_id"])
    return doc



#Dashboard----
class UpdateTaskRequest(BaseModel):
    docId: str
    taskIndex: int
    updates: dict

def get_schedule_from_doc(user_doc):
    """Handles both old (string) and new (dict) history formats."""
    raw_history = user_doc.get("history", {})
    if isinstance(raw_history, str):
        try:
            raw_history = json.loads(raw_history)
        except (json.JSONDecodeError, TypeError):
            raw_history = {}
    return raw_history.get("schedule", [])


def build_user_activity(email: str):
    """Build activity solely from the saved task `done` values in history."""
    completed_by_date = {}

    for history_doc in history.find({"email": email}, {"history": 1}):
        for task in get_schedule_from_doc(history_doc):
            task_date = task.get("date")
            if not task.get("done") or not isinstance(task_date, str):
                continue
            try:
                datetime.strptime(task_date, "%Y-%m-%d")
            except ValueError:
                continue
            completed_by_date[task_date] = completed_by_date.get(task_date, 0) + 1

    active_days = {datetime.strptime(day, "%Y-%m-%d").date() for day in completed_by_date}
    today = datetime.now().date()

    def consecutive_days_ending_on(end_day):
        streak = 0
        cursor = end_day
        while cursor in active_days:
            streak += 1
            cursor -= timedelta(days=1)
        return streak

    # Today may still be in progress, so yesterday's streak remains visible
    # until a full missed day has passed.
    current_end_day = today if today in active_days else today - timedelta(days=1)
    current_streak = consecutive_days_ending_on(current_end_day)
    longest_streak = max(
        (consecutive_days_ending_on(day) for day in active_days),
        default=0,
    )
    daily_activity = [
        {"date": day, "completedTasks": count}
        for day, count in sorted(completed_by_date.items())
    ]

    summary = UserActivity(
        email=email,
        dailyActivity=daily_activity,
        currentStreak=current_streak,
        longestStreak=longest_streak,
    ).model_dump()
    activity.update_one({"email": email}, {"$set": summary}, upsert=True)
    return summary


def get_study_time_summary(email: str):
    """Read the existing users.dailyStudy data and shape it for the dashboard."""
    user = users.find_one({"email": email}, {"dailyStudy": 1, "_id": 0}) or {}
    study_by_date = {}
    for record in user.get("dailyStudy", []):
        day = record.get("date")
        seconds = record.get("totalSeconds", 0)
        if isinstance(day, str) and isinstance(seconds, (int, float)):
            study_by_date[day] = study_by_date.get(day, 0) + max(0, int(seconds))

    today = datetime.now().date()
    monday = today - timedelta(days=today.weekday())
    weekly_study_time = []
    for offset in range(7):
        day = monday + timedelta(days=offset)
        date_string = day.isoformat()
        weekly_study_time.append({
            "date": date_string,
            "day": day.strftime("%a"),
            "totalSeconds": study_by_date.get(date_string, 0),
        })

    return {
        "todaySeconds": study_by_date.get(today.isoformat(), 0),
        "totalSeconds": sum(study_by_date.values()),
        "dailyStudy": [{"date": day, "totalSeconds": seconds} for day, seconds in sorted(study_by_date.items())],
        "weeklyStudyTime": weekly_study_time,
    }

def get_test_performance_summary(email: str):
    """Return persisted completed attempts for the Dashboard progress graph."""
    attempts = list(Tests.find({"email": email}, {"topic": 1, "accuracy": 1, "score": 1, "createdAt": 1, "questionType": 1}).sort("createdAt", 1))
    points = []
    for number, item in enumerate(attempts, 1):
        created = item.get("createdAt")
        points.append({"attempt": number, "topic": item.get("topic", "Test"), "accuracy": float(item.get("accuracy", item.get("score", 0))), "date": created.isoformat() if isinstance(created, datetime) else str(created or ""), "weakTopics": item.get("weakTopics", [])})
    return {"points": points, "average": round(sum(p["accuracy"] for p in points) / len(points), 1) if points else 0, "best": max((p["accuracy"] for p in points), default=0)}


@app.get("/api/dashboard/activity")
async def get_dashboard_activity(email: str):
    email = email.strip()
    if not users.find_one({"email": email}, {"_id": 1}):
        raise HTTPException(status_code=404, detail="User not found")

    summary = build_user_activity(email)
    first_day = (datetime.now().date() - timedelta(days=364)).isoformat()
    summary["dailyActivity"] = [
        item for item in summary["dailyActivity"] if item["date"] >= first_day
    ]
    summary["studyTime"] = get_study_time_summary(email)
    summary["testPerformance"] = get_test_performance_summary(email)
    return summary


@app.get("/api/dashboard/today-schedule")
async def get_today_schedule(email: str):
    """Return every saved schedule task whose calendar date is today."""
    email = email.strip()
    if not users.find_one({"email": email}, {"_id": 1}):
        raise HTTPException(status_code=404, detail="User not found")

    today = datetime.now().date().isoformat()
    tasks = []
    for history_doc in history.find({"email": email}, {"history": 1}):
        schedule = get_schedule_from_doc(history_doc)
        for task_index, task in enumerate(schedule):
            if task.get("date") != today:
                continue
            tasks.append({
                "docId": str(history_doc["_id"]),
                "taskIndex": task_index,
                "task": task.get("task", "Untitled topic"),
                "description": task.get("description", ""),
                "start_time": task.get("start_time", ""),
                "end_time": task.get("end_time", ""),
                "done": bool(task.get("done", False)),
                "revisionRequired": bool(task.get("revisionRequired", False)),
            })

    tasks.sort(key=lambda task: (task["start_time"] or "99:99", task["task"]))
    return {"date": today, "tasks": tasks}


@app.get("/api/dashboard/revision-tasks")
async def get_revision_tasks(email: str):
    """Return revision-marked tasks from the existing saved schedules."""
    email = email.strip()
    if not users.find_one({"email": email}, {"_id": 1}):
        raise HTTPException(status_code=404, detail="User not found")

    tasks = []
    for history_doc in history.find({"email": email}, {"history": 1}):
        for task_index, task in enumerate(get_schedule_from_doc(history_doc)):
            if not task.get("revisionRequired", False):
                continue
            tasks.append({
                "docId": str(history_doc["_id"]),
                "taskIndex": task_index,
                "task": task.get("task", "Untitled topic"),
                "description": task.get("description", ""),
                "date": task.get("date", ""),
                "start_time": task.get("start_time", ""),
                "end_time": task.get("end_time", ""),
                "done": bool(task.get("done", False)),
                "revisionRequired": True,
            })

    tasks.sort(key=lambda task: (task["date"] or "9999-99-99", task["start_time"] or "99:99", task["task"]))
    return {"tasks": tasks}




@app.post("/updateTask")
async def update_task(data: UpdateTaskRequest):
    user_doc = history.find_one({"_id": ObjectId(data.docId)})
    if not user_doc:
        raise HTTPException(status_code=404, detail="Document not found")

    schedule = get_schedule_from_doc(user_doc)
    if data.taskIndex < 0 or data.taskIndex >= len(schedule):
        raise HTTPException(status_code=400, detail="Invalid task index")

    schedule[data.taskIndex].update(data.updates)

    # Always write back in the new dict format, so it self-heals
    history.update_one(
        {"_id": ObjectId(data.docId)},
        {"$set": {"history": {"schedule": schedule}}}
    )

    build_user_activity(user_doc["email"])

    return {"success": True, "updatedTask": schedule[data.taskIndex]}

class AddTaskRequest(BaseModel):
    docId: str
    task: dict

@app.post("/addTask")
async def add_task(data: AddTaskRequest):
    user_doc = history.find_one({"_id": ObjectId(data.docId)})
    if not user_doc:
        raise HTTPException(status_code=404, detail="Document not found")

    schedule = get_schedule_from_doc(user_doc)
    schedule.append(data.task)

    history.update_one(
        {"_id": ObjectId(data.docId)},
        {"$set": {"history": {"schedule": schedule}}}
    )

    build_user_activity(user_doc["email"])

    return {"success": True, "task": data.task}

class DeleteTaskRequest(BaseModel):
    docId: str
    taskIndex: int

@app.post("/deleteTask")
async def delete_task(data: DeleteTaskRequest):
    user_doc = history.find_one({"_id": ObjectId(data.docId)})
    if not user_doc:
        raise HTTPException(status_code=404, detail="Document not found")

    schedule = get_schedule_from_doc(user_doc)

    if data.taskIndex < 0 or data.taskIndex >= len(schedule):
        raise HTTPException(status_code=400, detail="Invalid task index")

    removed_task = schedule.pop(data.taskIndex)

    history.update_one(
        {"_id": ObjectId(data.docId)},
        {"$set": {"history": {"schedule": schedule}}}
    )

    build_user_activity(user_doc["email"])

    return {"success": True, "deletedTask": removed_task}






#d send_email func
async def send_email(email: str, otp: str):

    message = MessageSchema(
        subject="Your OTP Code",
        recipients=[email],
        body=f"""
Hello,

Your OTP is: {otp}

This OTP is valid for 5 minutes.

Do not share it with anyone.
""",
        subtype="plain"
    )

    fm = FastMail(conf)
    await fm.send_message(message)


#1signup
class user(BaseModel):
    email:str
    

@app.post("/sendOTP")
async def signup(data:user):
    print("dataemail",data.email)

     # 1. Check if email already exists
    check= users.find_one({"email":data.email})
    if(check):
       raise HTTPException(
         status_code=409,
         detail="Email already registered"
    )

    
    
     # 2. Generate 6 digit OTP
    otp=str(random.randint(100000,999999))
    print("otp",otp)

      # 4. Expiry time
    expires_at=datetime.now()+ timedelta(minutes=5)
       # 5. Remove old OTP if exists
    otp_collection.delete_many({"email":data.email})

    # 6. Store OTP
    otp_collection.insert_one({
        "email":data.email,
        "OTP":otp,
        "expires_at":expires_at

    })
   # 7. Send email (implement this function)
    print("email send krre")
    await send_email(data.email,otp)
    print("email send hgai")

    return {"message":"OTP SENT SUCCESSFULLY"}



#2otp
class veri(BaseModel):
    email:str
    otp:str
    password:str
    username:str

@app.post("/verifyOTP")
async def verify(data:veri):
    print("inside api")

    check= otp_collection.find_one({"email":data.email})
    #phle se exist nhi jrta
    if not check:
       raise HTTPException(
       status_code=404,
       detail="User not found"
    )
    
    if datetime.now() > check["expires_at"]:
       raise HTTPException(
    status_code=401,
    detail="OTP EXPIRES"
)
    if check["OTP"] == data.otp:
        users.insert_one({"email":data.email,"password":data.password,"username":data.username})
        otp_collection.delete_one({"email":data.email})
        return {"message":"OTP VERIFIES SUCCESSFULLY"}
   
    raise HTTPException(
    status_code=404,
    detail="User not found"
)



#login

class logi(BaseModel):
    email:str
    password:str

@app.post("/Login")
async def login(data:logi):
    exist=users.find_one({"email":data.email})
    print("username",exist["username"])

    if not exist:
     raise HTTPException(status_code=404, detail="User not found")

    if exist["password"] != data.password:
     raise HTTPException(status_code=401, detail="Invalid password")

    return {
    "message": "Login successful",
    "username":exist["username"],
    "email":exist["email"]

    }

# @app.post("/resendOTP")
# async def resend(data: user):

#     otp = str(random.randint(100000, 999999))
#     expires_at = datetime.now() + timedelta(seconds=30)

#     otp_collection.update_one(
#         {"email": data.email},
#         {
#             "$set": {
#                 "OTP": otp,
#                 "expires_at": expires_at
#             }
#         }
#     )

#     await send_email(data.email, otp)

#     return {
#         "message": "OTP resent",
#         "expires_at": expires_at.isoformat()
#     }

# @app.get("/otp-status")
# async def otp_status(email: str):

#     check = otp_collection.find_one({"email": email})

#     if not check:
#         raise HTTPException(status_code=404, detail="OTP not found")

#     return {
#         "expires_at": check["expires_at"].isoformat()
#     }
class TestGenerationRequest(BaseModel):
    topic: str = ""
    numQuestions: int = 5
    difficulty: str = "Medium"
    email: str
    questionType: str = "MCQ"
    testMode: str = "Practice"
    examPattern: str = "Custom"
    personalization: dict = {}
    coverage: list[str] = []
    advancedOptions: dict = {}


class TestAttemptRequest(BaseModel):
    email: str
    topic: str
    questions: list[dict]
    answers: dict
    difficulty: str
    questionType: str
    testMode: str
    examPattern: str = "Custom"
    timeTaken: int = 0
    advancedOptions: dict = {}


def get_revision_topic_names(email: str):
    """Reuse the existing embedded planner revision flag instead of another model."""
    topics = []
    for history_doc in history.find({"email": email}, {"history": 1}):
        for task in get_schedule_from_doc(history_doc):
            if task.get("revisionRequired") and task.get("task"):
                topics.append(task["task"])
    return list(dict.fromkeys(topics))


def get_test_personalization(email: str, topic: str):
    attempts = list(Tests.find({"email": email}).sort("createdAt", -1).limit(20))
    topic_attempts = [item for item in attempts if item.get("topic", "").lower() == topic.lower()]
    mistakes = []
    for attempt in topic_attempts:
        mistakes.extend(attempt.get("mistakes", []))
    scores = [item.get("accuracy", item.get("score", 0)) for item in topic_attempts]
    return {
        "testsTaken": len(topic_attempts),
        "averageScore": round(sum(scores) / len(scores), 1) if scores else 0,
        "weakAreas": list(dict.fromkeys(m.get("question", "") for m in mistakes if m.get("question")))[:5],
    }
 
 
@app.post("/generateTest")
async def generate(data: TestGenerationRequest):
    print("email generateTest", data.email)
    try:
        if not users.find_one({"email": data.email}, {"_id": 1}):
            raise HTTPException(status_code=404, detail="User not found")

        revision_topics = get_revision_topic_names(data.email)
        topic = data.topic.strip()
        if data.testMode == "Revision Test" and revision_topics:
            topic = ", ".join(revision_topics)
        if not topic:
            topic = ", ".join(revision_topics) if revision_topics else "General study skills"

        performance = get_test_personalization(data.email, topic)
        selected_difficulty = data.difficulty
        if data.difficulty == "Adaptive" or data.testMode == "Challenge Me":
            selected_difficulty = "Easy" if performance["averageScore"] < 50 else "Hard" if performance["averageScore"] >= 80 else "Medium"

        short_answer_guidance = "For Short Answer questions, return `options`: [] and a concise reference answer in `correct_answer` (string). For Mixed, mix MCQ objects with these short-answer objects." if data.questionType in ("Short Answer", "Mixed") else ""

        prompt = f"""
You are an expert quiz generator for a study planner app.
 
Generate a {data.questionType} test on the given topic.
 
Return ONLY valid JSON. No markdown, no explanation, no extra text.
 
Format:
 
{{
  "questions": [
    {{
      "question": "What is the time complexity of binary search?",
      "options": ["O(n)", "O(log n)", "O(n^2)", "O(1)"],
      "correct_answer": 1,
      "correct_answers": [1],
      "explanation": "Binary search halves the search space each step.",
      "hint": "Think about halving the search area.",
      "questionType": "MCQ",
      "difficulty": "Medium",
      "topic": "Binary search"
    }}
  ]
}}
 
Rules:
1. Return only JSON, exactly matching the format above.
2. Generate exactly {data.numQuestions} questions.
3. Difficulty level: {selected_difficulty}.
4. Each question must have exactly 4 options, including True/False, Fill in the Blank, Coding, and Scenario Based questions.
5. "correct_answer" must be the INDEX (0-3) of one correct option. For Multiple Correct also provide every correct index in "correct_answers".
6. Questions must be relevant to the topic and factually accurate.
7. Do not repeat the same question twice.
8. Keep "explanation" and "hint" simple and short (max 1-2 sentences).
9. For Mixed, use a balanced mix of MCQ, True/False, Fill in the Blank, Multiple Correct, Scenario Based, and Coding. Otherwise set questionType to {data.questionType}.
10. Exam pattern: {data.examPattern}. Coverage: {", ".join(data.coverage) or "balanced"}.
11. Personalization requested: {json.dumps(data.personalization)}. Previous performance: {json.dumps(performance)}.
12. Use these revision topics when relevant: {", ".join(revision_topics) or "none"}.
 
Question-type guidance:
{short_answer_guidance}

Topic:
{topic}
"""
 
        response = groq_client.chat.completions.create(
            model=GROQ_MODEL,
            messages=[
                {
                    "role": "system",
                    "content": "You are an expert quiz generator that returns strict JSON only.",
                },
                {
                    "role": "user",
                    "content": prompt,
                },
            ],
            temperature=0.4,
        )
 
        content = response.choices[0].message.content
 
        if not content or content.strip() == "":
            return {
                "success": False,
                "error": "No response from the model.",
            }
 
        parsed = json.loads(content)
 
        questions = parsed.get("questions", [])
 
        if not questions:
            return {
                "success": False,
                "error": "Model did not return any questions.",
            }
 
        # Basic validation: drop malformed questions instead of failing the whole test
        valid_questions = []
        for q in questions:
            is_short_answer = data.questionType == "Short Answer" or (data.questionType == "Mixed" and not q.get("options"))
            if is_short_answer:
                if q.get("question") and isinstance(q.get("correct_answer"), str):
                    q["options"] = []
                    valid_questions.append(q)
            elif isinstance(q.get("options"), list) and len(q["options"]) == 4 and isinstance(q.get("correct_answer"), int) and 0 <= q["correct_answer"] <= 3 and q.get("question"):
                valid_questions.append(q)

        for question in valid_questions:
            question.setdefault("correct_answers", [question["correct_answer"]])
            question.setdefault("questionType", data.questionType if data.questionType != "Mixed" else "MCQ")
            question.setdefault("difficulty", selected_difficulty)
            question.setdefault("topic", topic)
            question.setdefault("hint", "Review the key idea in the question.")
 
        if not valid_questions:
            return {
                "success": False,
                "error": "Model returned malformed questions. Please try again.",
            }
 
        # tests.insert_one({
        #     "email": data.email,
        #     "topic": data.topic,
        #     "difficulty": data.difficulty,
        #     "questions": valid_questions,
        #     "created_at": datetime.now(timezone.utc),
        # })
 
        return {
            "success": True,
            "questions": valid_questions,
            "topic": topic,
            "difficulty": selected_difficulty,
            "revisionTopics": revision_topics,
        }
 
    except json.JSONDecodeError:
        return {
            "success": False,
            "error": "Model returned invalid JSON. Please try again.",
        }
    except Exception as e:
        return {
            "success": False,
            "error": str(e),
        }

@app.post("/api/tests/submit")
async def submit_test(data: TestAttemptRequest):
    if not users.find_one({"email": data.email}, {"_id": 1}):
        raise HTTPException(status_code=404, detail="User not found")

    correct = wrong = skipped = 0
    mistakes = []
    difficulty_stats = {}
    for index, question in enumerate(data.questions):
        selected = data.answers.get(str(index), data.answers.get(index))
        correct_answers = question.get("correct_answers", [question.get("correct_answer")])
        if not question.get("options") and isinstance(selected, str) and selected.strip():
            # Use the configured Groq model to grade open responses against the
            # generated reference answer, while keeping the same attempt record.
            try:
                grading_prompt = f"Return only JSON {{\"score\": 0.0}} to grade this answer from 0 to 1. Question: {question.get('question')} Reference answer: {question.get('correct_answer')} Student answer: {selected}"
                grading = groq_client.chat.completions.create(model=GROQ_MODEL, messages=[{"role": "system", "content": "You grade short educational answers fairly and return strict JSON."}, {"role": "user", "content": grading_prompt}], temperature=0)
                grade = json.loads(grading.choices[0].message.content).get("score", 0)
                question["aiScore"] = max(0, min(1, float(grade)))
            except Exception:
                question["aiScore"] = 0
            if question["aiScore"] >= 0.6:
                correct += 1; outcome = "correct"
            else:
                wrong += 1; outcome = "wrong"
                mistakes.append({"question": question.get("question", ""), "selectedAnswer": selected, "correctAnswers": correct_answers, "explanation": question.get("explanation", "Compare your response with the reference concept."), "topic": question.get("topic", data.topic), "difficulty": question.get("difficulty", data.difficulty)})
            difficulty = question.get("difficulty", data.difficulty); stats = difficulty_stats.setdefault(difficulty, {"correct": 0, "total": 0}); stats["total"] += 1
            if outcome == "correct": stats["correct"] += 1
            continue
        if selected is None or selected == []:
            skipped += 1
            outcome = "skipped"
        else:
            selected_set = sorted(selected if isinstance(selected, list) else [selected])
            if selected_set == sorted(correct_answers):
                correct += 1
                outcome = "correct"
            else:
                wrong += 1
                outcome = "wrong"
                mistakes.append({
                    "question": question.get("question", ""),
                    "selectedAnswer": selected,
                    "correctAnswers": correct_answers,
                    "explanation": question.get("explanation", "Review the related concept."),
                    "topic": question.get("topic", data.topic),
                    "difficulty": question.get("difficulty", data.difficulty),
                })
        difficulty = question.get("difficulty", data.difficulty)
        stats = difficulty_stats.setdefault(difficulty, {"correct": 0, "total": 0})
        stats["total"] += 1
        if outcome == "correct": stats["correct"] += 1

    total = len(data.questions)
    accuracy = round((correct / total) * 100, 1) if total else 0
    hint_penalty = len(data.advancedOptions.get("hintedQuestions", [])) * 0.25
    weak_topics = list(dict.fromkeys(item["topic"] for item in mistakes if item.get("topic")))
    attempt = data.model_dump()
    attempt.update({
        "score": correct,
        "scoreWithHintPenalty": max(0, correct - hint_penalty),
        "accuracy": accuracy,
        "correct": correct,
        "wrong": wrong,
        "skipped": skipped,
        "mistakes": mistakes,
        "weakTopics": weak_topics,
        "difficultyPerformance": difficulty_stats,
        "topicPerformance": {data.topic: {"correct": correct, "total": total, "accuracy": accuracy}},
        "understandingScore": data.advancedOptions.get("understandingScore"),
        "strengths": data.advancedOptions.get("strengths", []),
        "createdAt": datetime.now(),
    })
    Tests.insert_one(attempt)
    # PyMongo adds `_id: ObjectId(...)` to the dict passed to insert_one.
    # Do not return that BSON-only value directly in the JSON API response.
    attempt.pop("_id", None)

    all_attempts = list(Tests.find({"email": data.email}).sort("createdAt", -1))
    best_score = max((item.get("accuracy", item.get("score", 0)) for item in all_attempts), default=accuracy)
    def attempt_day(item):
        created_at = item.get("createdAt")
        if isinstance(created_at, datetime):
            return created_at.date()
        if isinstance(created_at, str):
            try:
                return datetime.fromisoformat(created_at.replace("Z", "+00:00")).date()
            except ValueError:
                pass
        # Older score-only test documents do not have createdAt.
        return datetime.now().date()

    unique_days = sorted({attempt_day(item) for item in all_attempts}, reverse=True)
    streak = 0
    cursor = datetime.now().date()
    for day in unique_days:
        if day == cursor:
            streak += 1
            cursor -= timedelta(days=1)
        elif day < cursor:
            break
    badges = []
    if len(all_attempts) == 1: badges.append("First Test")
    if len(all_attempts) >= 5: badges.append("5 Tests Completed")
    if streak >= 7: badges.append("7 Test Streak")
    if accuracy >= 90: badges.append("90% Club")
    if len({item.get("topic") for item in all_attempts if item.get("topic")}) >= 10: badges.append("10 Topics Mastered")

    return {"success": True, "result": attempt, "xpEarned": correct * 10 + (10 if accuracy >= 80 else 0), "testStreak": streak, "badges": badges, "bestScore": best_score}


@app.get("/api/tests/performance")
async def get_test_performance(email: str, topic: str = ""):
    attempts = list(Tests.find({"email": email, **({"topic": topic} if topic else {})}).sort("createdAt", -1))
    scores = [item.get("accuracy", item.get("score", 0)) for item in attempts]
    latest = attempts[0] if attempts else None
    mistakes = [mistake for item in attempts for mistake in item.get("mistakes", [])]
    weak_area = mistakes[0].get("topic") if mistakes else "No weak area identified yet"
    return {"averageScore": round(sum(scores) / len(scores), 1) if scores else 0, "bestScore": max(scores, default=0), "testsTaken": len(attempts), "lastTest": latest.get("createdAt").isoformat() if latest and latest.get("createdAt") else None, "weakArea": weak_area, "attempts": [{"topic": item.get("topic"), "accuracy": item.get("accuracy", item.get("score", 0)), "createdAt": item.get("createdAt").isoformat() if item.get("createdAt") else None} for item in attempts[:20]]}


class score(BaseModel):
    email: str
    score: int


@app.post("/storeScore")
async def store_score(data: score):
    if not users.find_one({"email": data.email}, {"_id": 1}):
        raise HTTPException(status_code=404, detail="User not found")
    Tests.insert_one({"email": data.email, "score": data.score})
    return {"message": "success"}




class Note(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid4()))
    text: str
    color: str
    pinned: bool = False


class GetNotes(BaseModel):
    email: str


class AddNote(BaseModel):
    email: str
    text: str
    color: str
    pinned: bool = False


# GET - load all notes
@app.get("/api/notes")
async def getNotes(email: str):

    response = Notes.find_one({"email": email})

    if not response:
        return {"notes": []}

    return {
        "message": "data found",
        "notes": response["notes"]
    }


# POST - add new note
@app.post("/api/notes")
async def addNote(data: AddNote):

    new_note = Note(
        text=data.text,
        color=data.color,
        pinned=data.pinned
    ).model_dump()
    new_note["createdAt"] = datetime.now().isoformat()

    response = Notes.find_one({"email": data.email})

    if not response:
        Notes.insert_one({
            "email": data.email,
            "notes": [new_note]
        })
    else:
        Notes.update_one(
            {"email": data.email},
            {"$push": {"notes": new_note}}
        )

    return new_note


# PUT - update note
@app.put("/api/notes/{note_id}")
async def update_note(note_id: str, data: dict):

    update_fields = {}

    if "text" in data:
        update_fields["notes.$.text"] = data["text"]

    if "color" in data:
        update_fields["notes.$.color"] = data["color"]

    if "pinned" in data:
        update_fields["notes.$.pinned"] = data["pinned"]

    if not update_fields:
        raise HTTPException(
            status_code=400,
            detail="Nothing to update"
        )

    result = Notes.update_one(
        {"notes.id": note_id},
        {"$set": update_fields}
    )

    if result.matched_count == 0:
        raise HTTPException(
            status_code=404,
            detail="Note not found"
        )

    return {"message": "Note updated successfully"}


# DELETE - delete note
@app.delete("/api/notes/{note_id}")
async def delete_note(note_id: str):

    result = Notes.update_one(
        {"notes.id": note_id},
        {"$pull": {"notes": {"id": note_id}}}
    )

    if result.modified_count == 0:
        raise HTTPException(
            status_code=404,
            detail="Note not found"
        )

    return {"message": "Note deleted successfully"}







    

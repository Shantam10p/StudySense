# Sensei AI

An AI-powered study planning and tutoring app for students looking to study a course with a target date in mind. Sensei AI generates personalized study plans, produces structured notes and practice questions per topic, and provides an interactive AI tutor with per-session chat memory.

---

# Video Demo:

https://github.com/user-attachments/assets/09b0ae76-872c-42f3-acc3-8ab64577d343

## Features

- **AI Study Plan Generation** — input your course, exam date, and daily study hours; get a day-by-day study schedule
- **Sensei AI Tutor** — chat with an AI assistant that knows your topic, with sliding window memory for long conversations
- **Structured Notes & Practice Questions** — auto-generated concepts and Q&A per study topic
- **Study Mode** — full-screen interface with a timer, notes, practice questions, and live chat in one place
- **Progress Tracking** — completed sessions, day streaks, and per-course progress
- **Chat History** — conversation is saved per study session and restored when you return

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 19, TypeScript, Vite, Tailwind CSS |
| Backend | FastAPI, Python 3.11, Uvicorn |
| Database | MySQL |
| AI / LLM | OpenAI API (GPT-4o-mini), LangChain, LangGraph |
| Auth | Custom HMAC-SHA256 token + PBKDF2 password hashing |

---

## Project Structure

```
StudySense/
├── backend/
│   ├── main.py                  # FastAPI app entry point
│   ├── requirements.txt
│   ├── .env                     # Environment config (not committed)
│   ├── app/
│   │   ├── agents/              # LangGraph agents (planner, sensei)
│   │   ├── api/v1/endpoints/    # Route handlers
│   │   ├── core/                # Config, security utilities
│   │   ├── db/                  # MySQL connection
│   │   ├── schemas/             # Pydantic request/response models
│   │   └── services/            # Business logic
│   └── sql/migrations/          # SQL migration files (run in order)
│
└── frontend/
    ├── src/
    │   ├── api/                 # API client functions
    │   ├── components/          # Reusable UI components
    │   ├── pages/               # Route-level page components
    │   ├── types/               # TypeScript types
    │   └── utils/               # Helpers
    └── package.json
```

---

## Getting Started

### Prerequisites

- Python 3.11+
- Node.js 18+
- MySQL (running on your machine)
- OpenAI API key

---

### Backend

**1. Install dependencies**
```bash
cd backend
pip install -r requirements.txt
```

**2. Create a `.env` file in `backend/`**
```env
DB_HOST=127.0.0.1
DB_PORT=3307
DB_USER=root
DB_PASSWORD=your_password
DB_NAME=sensei

OPENAI_API_KEY=sk-...
PLANNER_AGENT_MODEL=gpt-4o-mini

SECRET_KEY=your_secret_key_here
ACCESS_TOKEN_EXPIRE_MINUTES=1440
```

**3. Set up the database**

Create the `sensei_db` database in MySQL, then run the migration files in order:
```bash
# In your MySQL client
source sql/migrations/001_planner_phase1.sql
source sql/migrations/002_auth_phase1.sql
source sql/migrations/003_study_task_completions.sql
source sql/migrations/004_sensei_content.sql
source sql/migrations/005_chat_history.sql
```

**4. Start the server**
```bash
uvicorn main:app --reload --host 127.0.0.1 --port 8000
```

API available at `http://127.0.0.1:8000`

---

### Frontend

**1. Install dependencies**
```bash
cd frontend
npm install
```

**2. Start the dev server**
```bash
npm run dev
```

App available at `http://localhost:5173`

---

## API Overview

Base URL: `http://localhost:8000/api/v1`

| Method | Endpoint | Description |
|---|---|---|
| POST | `/auth/signup` | Register a new user |
| POST | `/auth/login` | Login |
| POST | `/planner/generate-ai` | Generate a study plan |
| GET | `/planner/course/{id}` | Fetch an existing plan |
| GET | `/courses` | List courses |
| DELETE | `/courses/{id}` | Delete a course |
| GET | `/study-progress/stats` | Dashboard stats (streak, completions) |
| POST | `/study-progress/tasks/{id}/complete` | Mark task complete |
| POST | `/chat/content` | Generate notes + practice questions |
| POST | `/chat/message` | Send a message to Sensei |
| GET | `/chat/history/{task_id}` | Load chat history for a session |
| DELETE | `/chat/history/{task_id}` | Clear chat history |

All endpoints except `/auth/*` require `Authorization: Bearer <token>`.

---

## Notes

- The app works without an OpenAI API key — it falls back to static defaults for plan generation and disables Sensei AI features
- Chat memory uses a sliding window: the last 10 messages are sent verbatim; older messages are summarized by the LLM to preserve context without bloating token usage
- Sensei content (notes + practice questions) is cached per user/course/topic to avoid redundant LLM calls

# StudySense Backend Architecture

**A clear guide to understanding how the StudySense backend works.**

---

## Table of Contents

1. [System Overview](#1-system-overview)
2. [Project Structure](#2-project-structure)
3. [Configuration & Environment](#3-configuration--environment)
4. [Database Schema](#4-database-schema)
5. [Authentication & Security](#5-authentication--security)
6. [API Endpoints](#6-api-endpoints)
7. [Study Plan Generation Flow](#7-study-plan-generation-flow)
8. [Testing Guide](#8-testing-guide)

---

## 1. System Overview

### What is StudySense?

StudySense is a FastAPI-based REST API that helps students create personalized study plans for their exams.

### Tech Stack

| Component | Technology |
|-----------|-----------|
| **Framework** | FastAPI |
| **Database** | MySQL |
| **AI/LLM** | OpenAI (optional, with fallback) |
| **Auth** | Custom HMAC-signed tokens |
| **Password Security** | PBKDF2-HMAC-SHA256 |

### Key Features

- ✅ User authentication (signup/login)
- ✅ AI-powered study plan generation
- ✅ Deterministic scheduling algorithm
- ✅ Course and task management
- ✅ Token-based authorization

---

## 2. Project Structure

```
backend/
├── main.py                          # FastAPI app entry point
├── app/
│   ├── api/
│   │   ├── deps.py                  # Dependency injection (auth)
│   │   └── v1/
│   │       ├── router.py            # Main API router
│   │       └── endpoints/
│   │           ├── auth.py          # Login/signup endpoints
│   │           ├── planner.py       # Study plan endpoints
│   │           ├── courses.py       # Course CRUD endpoints
│   │           ├── health.py        # Health check
│   │           └── chat.py          # (Not implemented yet)
│   ├── core/
│   │   ├── config.py                # Environment configuration
│   │   └── security.py              # Token & password utilities
│   ├── db/
│   │   └── database.py              # MySQL connection
│   ├── services/
│   │   ├── auth_service.py          # Auth business logic
│   │   ├── planner_service.py       # Plan generation logic
│   │   └── course_service.py        # Course management logic
│   ├── agents/
│   │   └── planner_agent.py         # AI topic analysis (LangGraph)
│   └── schemas/
│       ├── auth.py                  # Auth request/response models
│       ├── planner.py               # Planner models
│       └── course.py                # Course models
```

### How Requests Flow

```
Client Request
    ↓
main.py (FastAPI app)
    ↓
api/v1/router.py (routes to correct endpoint)
    ↓
api/v1/endpoints/*.py (validates & calls service)
    ↓
services/*.py (business logic)
    ↓
db/database.py (MySQL queries)
```

---

## 3. Configuration & Environment

### Required Environment Variables

Create a `.env` file in the `backend/` directory:

```env
# API Configuration
PROJECT_NAME=StudySense
API_V1_STR=/api/v1

# Security (IMPORTANT: Change in production!)
SECRET_KEY=your-secret-key-here
ACCESS_TOKEN_EXPIRE_MINUTES=60

# Database
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=your_password
DB_NAME=studysense

# OpenAI (Optional - uses fallback if not provided)
OPENAI_API_KEY=sk-...
PLANNER_AGENT_MODEL=gpt-4o-mini
```

### Configuration Loading

- **File**: `app/core/config.py`
- **Method**: Uses `python-dotenv` to load `.env` file
- **Access**: `get_settings()` returns a cached `Settings` instance

---

## 4. Database Schema

### Tables Overview

```
users
├── id (PRIMARY KEY)
├── name
├── email (UNIQUE)
├── password_hash
├── is_active
└── created_at

courses
├── id (PRIMARY KEY)
├── user_id (FOREIGN KEY → users.id)
├── course_name
├── exam_date
├── daily_study_hours
└── input_hash (for idempotency)

daily_plans
├── id (PRIMARY KEY)
├── course_id (FOREIGN KEY → courses.id)
└── plan_date

study_tasks
├── id (PRIMARY KEY)
├── daily_plan_id (FOREIGN KEY → daily_plans.id)
├── title
├── duration_minutes
├── task_type (study/review)
└── position (order within day)
```

### Relationships

```
User (1) ──── (many) Courses
Course (1) ──── (many) DailyPlans
DailyPlan (1) ──── (many) StudyTasks
```

---

## 5. Authentication & Security

### How Authentication Works

#### Step 1: User Signs Up or Logs In

**Endpoint**: `POST /api/v1/auth/signup` or `POST /api/v1/auth/login`

**Request**:
```json
{
  "email": "student@example.com",
  "password": "securepassword123",
  "name": "John Doe"  // only for signup
}
```

**Response**:
```json
{
  "access_token": "eyJzdWIi...abc123",
  "token_type": "bearer",
  "user": {
    "id": 1,
    "name": "John Doe",
    "email": "student@example.com",
    "is_active": true,
    "created_at": "2026-03-22T21:40:00"
  }
}
```

#### Step 2: Use Token for Protected Endpoints

Add this header to all protected requests:

```
Authorization: Bearer eyJzdWIi...abc123
```

### Password Security

**File**: `app/core/security.py`

- **Algorithm**: PBKDF2-HMAC-SHA256
- **Iterations**: 100,000
- **Salt**: Random 16-byte hex (unique per password)
- **Storage Format**: `{salt}${derived_key_hex}`

```python
# Example stored hash:
"a1b2c3d4e5f6...${derived_key_hex}"
```

### Token Security (Custom, Not JWT)

**.Why custom?** Simpler, no external dependencies, full control.

#### Token Structure

```
{base64_payload}.{hmac_signature}
```

#### Payload (before encoding)

```json
{
  "sub": "1",              // user_id as string
  "email": "user@example.com",
  "exp": 1711234567        // expiration timestamp
}
```

#### How Tokens Are Created

1. Build JSON payload with `user_id`, `email`, `exp`
2. Base64-URL-encode the payload
3. Generate HMAC-SHA256 signature using `SECRET_KEY`
4. Combine: `{encoded_payload}.{signature}`

#### How Tokens Are Validated

**File**: `app/api/deps.py` → `get_current_user()`

1. Extract token from `Authorization: Bearer <token>` header
2. Split into `payload` and `signature`
3. Verify signature matches (using `SECRET_KEY`)
4. Decode payload and check expiration
5. Return `{ "id": user_id, "email": email }`

**If invalid**: Returns `401 Unauthorized`

### SECRET_KEY Importance

⚠️ **CRITICAL**: The `SECRET_KEY` signs all tokens.

- **Development**: Default is `study-sense-dev-secret`
- **Production**: MUST be changed to a strong random value
- **Rotation**: Changing it invalidates all existing tokens

---

## 6. API Endpoints

### Base URL

All endpoints are prefixed with: `/api/v1`

### Public Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/health` | Health check |
| `POST` | `/auth/signup` | Create new user |
| `POST` | `/auth/login` | Login existing user |

### Protected Endpoints (Require Authorization Header)

#### Planner

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/planner/generate` | Generate study plan |
| `POST` | `/planner/generate-ai` | Same as above (alias) |
| `GET` | `/planner/course/{course_id}` | Get plan for course |

#### Courses

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/courses` | List all user's courses |
| `GET` | `/courses/{course_id}` | Get specific course |
| `PUT` | `/courses/{course_id}` | Update course |
| `DELETE` | `/courses/{course_id}` | Delete course |

### Example: Generate Study Plan

**Request**:
```http
POST /api/v1/planner/generate
Authorization: Bearer eyJzdWIi...abc123
Content-Type: application/json

{
  "course_name": "Physics 101",
  "exam_date": "2026-05-15",
  "topics": ["Kinematics", "Dynamics", "Energy", "Momentum"],
  "daily_study_hours": 2.5,
  "textbook": "Halliday & Resnick"
}
```

**Response**:
```json
{
  "course_id": 42,
  "course_name": "Physics 101",
  "exam_date": "2026-05-15",
  "daily_plans": [
    {
      "id": 100,
      "day": "2026-03-23",
      "tasks": [
        {
          "id": 500,
          "title": "Study Kinematics using Halliday & Resnick",
          "duration_minutes": 60,
          "task_type": "study",
          "position": 1
        },
        {
          "id": 501,
          "title": "Study Dynamics using Halliday & Resnick",
          "duration_minutes": 60,
          "task_type": "study",
          "position": 2
        }
      ]
    }
  ]
}
```

---

## 7. Study Plan Generation Flow

### Overview

The planner combines **AI analysis** (optional) with a **deterministic scheduling algorithm** to create personalized study plans.

### Step-by-Step Process

#### Step 1: Request Validation

**File**: `app/services/planner_service.py` → `generate_plan()`

Checks:
- ✅ Topics list is not empty
- ✅ `daily_study_hours > 0`
- ✅ `exam_date` is in the future

#### Step 2: Idempotency Check

**Purpose**: Avoid regenerating identical plans.

1. Create SHA-256 hash of normalized input:
   - `course_name`, `exam_date`, `topics`, `daily_study_hours`, `textbook`
2. Check if a course with this `input_hash` already exists for the user
3. If yes AND it has a plan → return existing plan
4. If no → continue to generation

#### Step 3: AI Topic Analysis (Optional)

**File**: `app/agents/planner_agent.py`

**If `OPENAI_API_KEY` is set**:
- Uses LangGraph pipeline: `prepare_topics` → `analyze_topics`
- Prompts OpenAI to return structured JSON:
  ```json
  {
    "topics": [
      {
        "name": "Kinematics",
        "priority": "high",
        "difficulty": "medium",
        "total_minutes": 180,
        "session_count": 3,
        "review_sessions": 1,
        "preferred_session_minutes": 60
      }
    ]
  }
  ```

**If no API key OR parsing fails**:
- Uses deterministic fallback (120 min, 2 study sessions, 1 review per topic)

#### Step 4: Build Study Sessions

**File**: `app/services/planner_service.py` → `_build_scheduled_sessions()`

Converts analyzed topics into session objects:

```python
[
  {
    "topic": "Kinematics",
    "task_type": "study",
    "duration_minutes": 60
  },
  {
    "topic": "Kinematics",
    "task_type": "study",
    "duration_minutes": 60
  },
  {
    "topic": "Kinematics",
    "task_type": "review",
    "duration_minutes": 30
  }
]
```

#### Step 5: Deterministic Scheduling

**File**: `app/services/planner_service.py` → `_build_deterministic_schedule()`

**Algorithm**:

1. Calculate available days: `exam_date - today`
2. Set daily time budget: `daily_study_hours * 60` minutes
3. For each session:
   - Try to fit in current day
   - If exceeds budget → move to next day
   - Minimum session duration: 30 minutes
4. Generate task titles:
   - Study: `"Study {topic} using {textbook}"`
   - Review: `"Review {topic}"`

**Example**:

```
Input:
- Topics: ["Kinematics", "Dynamics"]
- Daily hours: 2.5 (150 minutes)
- Exam date: 10 days away

Output:
Day 1: Study Kinematics (60m) + Study Dynamics (60m)
Day 2: Review Kinematics (30m) + Study Dynamics (60m)
...
```

#### Step 6: Save to Database

**File**: `app/services/planner_service.py` → `_replace_course_plan()`

1. Delete existing `daily_plans` for this course (if any)
2. Insert new `daily_plans` rows (one per day)
3. Insert `study_tasks` rows (linked to daily_plans)
4. Commit transaction

#### Step 7: Return Response

Fetch and return the complete plan with all days and tasks.

### Visual Flow Diagram

```
User Request
    ↓
Validate Input
    ↓
Check Idempotency (input_hash)
    ├─ Exists? → Return Cached Plan
    └─ New? ↓
AI Analysis (or Fallback)
    ↓
Build Sessions List
    ↓
Deterministic Scheduler
    ↓
Save to Database
    ↓
Return Plan Response
```

---

## 8. Testing Guide

### Quick Start: Test the Planner

#### 1. Get an Access Token

```bash
curl -X POST http://localhost:8000/api/v1/auth/signup \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test User",
    "email": "test@example.com",
    "password": "password123"
  }'
```

**Copy the `access_token` from the response.**

#### 2. Generate a Study Plan

```bash
curl -X POST http://localhost:8000/api/v1/planner/generate \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -d '{
    "course_name": "Calculus I",
    "exam_date": "2026-05-01",
    "topics": ["Limits", "Derivatives", "Integrals"],
    "daily_study_hours": 3,
    "textbook": "Stewart Calculus"
  }'
```

#### 3. Retrieve the Plan

```bash
curl -X GET http://localhost:8000/api/v1/planner/course/1 \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

### Common Error Codes

| Code | Meaning | Solution |
|------|---------|----------|
| `401` | Unauthorized | Check your token or login again |
| `400` | Bad Request | Validate your request body |
| `404` | Not Found | Course doesn't exist or wrong ID |
| `409` | Conflict | Email already registered |

### Testing with Postman/Insomnia

1. Create a new request
2. Set method and URL
3. Add header: `Authorization: Bearer <your_token>`
4. Add JSON body (for POST/PUT)
5. Send request

---

## Summary

### Key Takeaways

1. **Authentication**: Custom HMAC tokens, not JWT
2. **Security**: PBKDF2 password hashing + signed tokens
3. **Planner**: AI analysis (optional) + deterministic scheduler
4. **Idempotency**: Plans cached by input hash
5. **Database**: MySQL with clear relational structure

### Important Files Reference

| Purpose | File |
|---------|------|
| App entry | `main.py` |
| Auth logic | `app/services/auth_service.py` |
| Token creation | `app/core/security.py` |
| Token validation | `app/api/deps.py` |
| Plan generation | `app/services/planner_service.py` |
| AI analysis | `app/agents/planner_agent.py` |
| Config | `app/core/config.py` |

---

**Last Updated**: March 2026  
**Maintainer**: StudySense Team

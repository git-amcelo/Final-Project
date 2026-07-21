# GymBuddy Backend API

Django + DRF backend for the GymBuddy fitness partner matching platform.

## Tech Stack

- **Backend:** Django 5.2, Django REST Framework
- **Auth:** JWT (djangorestframework-simplejwt)
- **Database:** PostgreSQL (production) / SQLite (development)
- **Storage:** Local file system (configurable for cloud storage)

## Project Structure

```
gymbuddy/
├── gymbuddy/                 # Project config
│   ├── settings/
│   │   ├── base.py          # Base settings
│   │   ├── development.py   # Dev settings
│   │   └── production.py    # Production settings
│   ├── urls.py
│   └── wsgi.py
├── apps/
│   ├── users/               # User management & profiles
│   ├── workouts/            # Workout sessions & booking
│   ├── groups/              # Group workouts
│   ├── matching/            # Smart matching algorithm
│   └── ratings/             # Rating & reviews
├── media/                   # User uploads
├── requirements/
│   ├── base.txt
│   └── development.txt
└── manage.py
```

## Setup Instructions

### 1. Create Virtual Environment

```bash
python -m venv .venv
source .venv/bin/activate  # On Windows: .venv\Scripts\activate
```

### 2. Install Dependencies

```bash
pip install -r requirements/development.txt
```

### 3. Configure Environment Variables

Create a `.env` file in the project root:

```bash
# Database
DATABASE_URL=postgresql://user:password@localhost:5432/gymbuddy
# Or use SQLite (default)

# Security
DJANGO_SECRET_KEY=your-secret-key-here
CSRF_TRUSTED_ORIGINS=http://localhost:3000

# CORS
CORS_ALLOW_ALL_ORIGINS=True  # For development
```

### 4. Run Migrations

```bash
python manage.py makemigrations
python manage.py migrate
```

### 5. Create Superuser

```bash
python manage.py createsuperuser
```

### 6. Load Seed Data (Fixtures)

Each app ships an `initial_data.json` fixture (dumped from the demo database with `manage.py dumpdata`). Loading them seeds users, workout sessions, groups and ratings so the site isn't empty on first run:

```bash
python manage.py loaddata initial_data
```

Django finds `initial_data.json` automatically in every app's `fixtures/` directory
(`apps/users/fixtures/`, `apps/workouts/fixtures/`, `apps/groups/fixtures/`, `apps/ratings/fixtures/`).

### 7. Run Development Server

```bash
python manage.py runserver
```

The API will be available at `http://localhost:8000/api/`

## Template Site (Bootstrap, session auth)

Alongside the `/api/` REST endpoints (used by the Next.js frontend in `frontend/`), the project
serves a server-rendered Bootstrap site directly from Django, at the root URL:

| Path | Purpose |
|---|---|
| `/` | Home page (public) |
| `/about/`, `/contact/` | About Us / Contact Us (public) |
| `/accounts/login/`, `/accounts/signup/`, `/accounts/logout/` | Session auth |
| `/accounts/password_reset/` | Forgot-password flow (reset link is printed to the console) |
| `/sessions/` | Workout sessions — class-based `ListView`/`DetailView`, keyword search + intensity/type dropdown filters, create/edit/delete (login required) |
| `/community/` | Fitness groups — class-based `ListView`/`DetailView`, search + type dropdown, create/join/leave (login required) |
| `/members/` | Buddy directory — registered users only |
| `/profile/`, `/profile/edit/` | Own profile, including profile picture upload |
| `/history/` | User History — visit counts and recently viewed pages, tracked via session + a `last_visit` cookie (see `gymbuddy/middleware.py`) |
| `/reviews/mine/`, `/reviews/rate/<user_id>/` | Ratings |

Guests can browse sessions and groups but are redirected to login for member-only pages
(buddy directory, profile, creating/joining, history-gated actions) — see `LoginRequiredMixin`/`@login_required` in each app's `views.py`.

## API Endpoints

### Authentication
```
POST   /api/register/              - Register new user
POST   /api/token/                 - Login (get JWT tokens)
POST   /api/token/refresh/         - Refresh access token
```

### User Profiles
```
GET    /api/profile/               - Get current user profile
PUT    /api/profile/               - Update profile
PATCH  /api/profile/               - Partial update
GET    /api/<id>/                  - Get public user profile
GET    /api/                       - List/search users
```

### Social Features
```
POST   /api/favorites/             - Add to favorites
DELETE /api/favorites/<id>/       - Remove favorite
GET    /api/favorites/             - List favorites
POST   /api/blocked/               - Block user
DELETE /api/blocked/<id>/         - Unblock user
```

### Workout Sessions
```
GET    /api/workouts/              - List sessions
POST   /api/workouts/              - Create session
GET    /api/workouts/<id>/         - Get session details
PUT    /api/workouts/<id>/         - Update session
DELETE /api/workouts/<id>/         - Cancel session
POST   /api/workouts/<id>/request/ - Request to join
GET    /api/workouts/my/           - My sessions
GET    /api/workouts/available/    - Available sessions
```

### Groups
```
GET    /api/groups/                - List groups
POST   /api/groups/                - Create group
GET    /api/groups/<slug>/         - Get group details
POST   /api/groups/<slug>/join/   - Join group
POST   /api/groups/<slug>/leave/  - Leave group
GET    /api/groups/my/             - My groups
```

### Matching
```
POST   /api/matching/find-buddies/ - Find compatible buddies
GET    /api/matching/top-matches/  - Get top matches
GET    /api/matching/compatibility/<id>/ - Compatibility breakdown
```

### Ratings
```
GET    /api/ratings/               - List ratings
POST   /api/ratings/               - Create rating
GET    /api/ratings/stats/<id>/    - User rating stats
GET    /api/ratings/summary/       - My rating summary
```

## Testing the API

### Register a User
```bash
curl -X POST http://localhost:8000/api/register/ \
  -H "Content-Type: application/json" \
  -d '{
    "username": "testuser",
    "email": "test@example.com",
    "password": "testpass123",
    "password_confirm": "testpass123"
  }'
```

### Login
```bash
curl -X POST http://localhost:8000/api/token/ \
  -H "Content-Type: application/json" \
  -d '{
    "username": "testuser",
    "password": "testpass123"
  }'
```

### Get Profile (with token)
```bash
curl -X GET http://localhost:8000/api/profile/ \
  -H "Authorization: Bearer <access_token>"
```

### Find Workout Buddies
```bash
curl -X POST http://localhost:8000/api/matching/find-buddies/ \
  -H "Authorization: Bearer <access_token>" \
  -H "Content-Type: application/json" \
  -d '{
    "fitness_level": "intermediate",
    "goals": ["strength", "cardio"]
  }'
```

## Matching Algorithm

The smart matching algorithm calculates compatibility scores based on:

- **Fitness Level (20 points)**: Same or similar fitness levels
- **Goals Overlap (30 points)**: Shared fitness goals
- **Availability (25 points)**: Matching workout schedules
- **Location (15 points)**: Same gym preferences
- **Interests (10 points)**: Shared fitness interests

## Admin Panel

Access the Django admin at `http://localhost:8000/admin/`

## Frontend Integration

For the Next.js frontend team:

1. **Base URL**: `http://localhost:8000/api/`
2. **Authentication**: Use JWT tokens in `Authorization: Bearer <token>` header
3. **Token Refresh**: Use `/api/token/refresh/` to get new access tokens
4. **Media Files**: Profile pictures at `http://localhost:8000/media/profiles/`
5. **CORS**: Configured for `http://localhost:3000`

## Database Models

### User & UserProfile
- Custom User model with role (student/alumni)
- Extended profile with fitness attributes
- Fitness goals, availability, preferences
- Block and favorite lists

### WorkoutSession
- 1-on-1 or group sessions
- Scheduling and location
- Status management (pending, accepted, completed)
- Participant requests

### WorkoutGroup
- Open/closed/private groups
- Member management
- Group sessions
- Attendance tracking

### Rating
- 1-5 star ratings
- Category ratings (punctuality, communication, etc.)
- Per-session ratings
- Automatic profile rating updates

## Team Roles

- **Chen, Mingran**: Django Backend (Models, API)
- **Shaukat, Abdullah**: Auth & Security (JWT, Sessions)
- **Singh, Harpreet**: Frontend UI (Next.js, Tailwind)
- **Thakur, Chetan**: API Integration & Data Fetching
- **Zhang, Yarong**: Search Logic & Media Uploads

## License

University of Windsor - COMP8347 Final Project

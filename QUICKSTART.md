# 🚀 GymBuddy Quick Start

## One-Command Startup

```bash
./start.sh
```

That's it! The script will:

1. ✅ Create virtual environment (if needed)
2. ✅ Install all dependencies
3. ✅ Run database migrations
4. ✅ Start Django backend on `http://localhost:8000`
5. ✅ Start Next.js frontend on `http://localhost:3000`
6. ✅ Monitor both servers

## Stop Servers

Press `Ctrl+C` to stop both servers cleanly.

## What's Running

| Service | URL | Description |
|---------|-----|-------------|
| Frontend | http://localhost:3000 | Next.js web application |
| Backend | http://localhost:8000 | Django REST API |
| Admin | http://localhost:8000/admin | Django admin panel |
| API | http://localhost:8000/api | API endpoints |

## First Time Setup

The first run will take longer as it:
- Creates Python virtual environment
- Installs all dependencies (~100 packages)
- Runs database migrations
- Installs npm packages

Subsequent runs are much faster!

## Troubleshooting

### Port Already in Use
```bash
# Kill processes on ports 8000 and 3000
lsof -ti:8000 | xargs kill -9
lsof -ti:3000 | xargs kill -9
```

### Clean Restart
```bash
# Remove virtual environment and node_modules
rm -rf .venv frontend/node_modules
./start.sh
```

### View Logs
```bash
# Django logs
tail -f logs/django.log

# Next.js logs
tail -f logs/nextjs.log
```

## Manual Startup (If Script Fails)

```bash
# Terminal 1 - Backend
source .venv/bin/activate
python manage.py runserver

# Terminal 2 - Frontend
cd frontend
npm run dev
```

---

**Need help?** Check `FRONTEND_BACKEND_INTEGRATION.md` for detailed documentation.

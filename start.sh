#!/bin/bash

# GymBuddy Full-Stack Startup Script
# Starts Django backend and Next.js frontend simultaneously

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Get script directory
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
cd "$SCRIPT_DIR"

echo -e "${BLUE}╔════════════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║                                                            ║${NC}"
echo -e "${BLUE}║${NC}       ${GREEN}GymBuddy Full-Stack Application${NC}                ${BLUE}║${NC}"
echo -e "${BLUE}║${NC}                                                              ${BLUE}║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════════════════════════╝${NC}"
echo ""

# Function to cleanup processes
cleanup() {
    echo ""
    echo -e "${YELLOW}Stopping GymBuddy servers...${NC}"

    # Kill Django backend
    if [ ! -z "$DJANGO_PID" ]; then
        echo -e "${YELLOW}  → Stopping Django backend (PID: $DJANGO_PID)${NC}"
        kill $DJANGO_PID 2>/dev/null || true
    fi

    # Kill Next.js frontend
    if [ ! -z "$NEXT_PID" ]; then
        echo -e "${YELLOW}  → Stopping Next.js frontend (PID: $NEXT_PID)${NC}"
        kill $NEXT_PID 2>/dev/null || true
    fi

    # Also kill any process on ports 8000 and 3000
    lsof -ti:8000 | xargs kill -9 2>/dev/null || true
    lsof -ti:3000 | xargs kill -9 2>/dev/null || true

    echo -e "${GREEN}✓ All servers stopped${NC}"
    exit 0
}

# Trap Ctrl+C and call cleanup
trap cleanup SIGINT SIGTERM

# ============================================
# DJANGO BACKEND SETUP
# ============================================
echo -e "${BLUE}[1/5] Setting up Django Backend...${NC}"

# Check if virtual environment exists
if [ ! -d ".venv" ]; then
    echo -e "${YELLOW}  → Creating virtual environment...${NC}"
    python3 -m venv .venv
fi

# Activate virtual environment
echo -e "${YELLOW}  → Activating virtual environment...${NC}"
source .venv/bin/activate

# Install/upgrade pip
echo -e "${YELLOW}  → Ensuring pip is up to date...${NC}"
pip install --upgrade pip -q

# Install requirements
echo -e "${YELLOW}  → Installing dependencies...${NC}"
pip install -r requirements/development.txt -q

# Run migrations
echo -e "${YELLOW}  → Running database migrations...${NC}"
python manage.py migrate --no-input

echo -e "${GREEN}✓ Django backend ready${NC}"

# ============================================
# NEXT.JS FRONTEND SETUP
# ============================================
echo ""
echo -e "${BLUE}[2/5] Setting up Next.js Frontend...${NC}"

cd frontend

# Check if node_modules exists
if [ ! -d "node_modules" ]; then
    echo -e "${YELLOW}  → Installing frontend dependencies...${NC}"
    npm install
else
    echo -e "${GREEN}✓ Dependencies already installed${NC}"
fi

# Create .env.local if not exists
if [ ! -f ".env.local" ]; then
    echo -e "${YELLOW}  → Creating .env.local file...${NC}"
    cp .env.example .env.local
fi

cd ..
echo -e "${GREEN}✓ Next.js frontend ready${NC}"

# ============================================
# START SERVERS
# ============================================
echo ""
echo -e "${BLUE}[3/5] Starting Servers...${NC}"

# Kill any existing processes on ports
echo -e "${YELLOW}  → Clearing ports 8000 and 3000...${NC}"
lsof -ti:8000 | xargs kill -9 2>/dev/null || true
lsof -ti:3000 | xargs kill -9 2>/dev/null || true

# Start Django backend
echo -e "${YELLOW}  → Starting Django backend on http://localhost:8000${NC}"
source .venv/bin/activate
python manage.py runserver > logs/django.log 2>&1 &
DJANGO_PID=$!
echo -e "${GREEN}    Django PID: $DJANGO_PID${NC}"

# Wait a moment for Django to start
sleep 2

# Start Next.js frontend
echo -e "${YELLOW}  → Starting Next.js frontend on http://localhost:3000${NC}"
cd frontend
npm run dev > ../logs/nextjs.log 2>&1 &
NEXT_PID=$!
cd ..
echo -e "${GREEN}    Next.js PID: $NEXT_PID${NC}"

# ============================================
# WAIT & MONITOR
# ============================================
echo ""
echo -e "${BLUE}[4/5] Warming up...${NC}"
sleep 3

# Create logs directory if not exists
mkdir -p logs

echo -e "${BLUE}[5/5] Servers Running!${NC}"
echo ""
echo -e "${GREEN}╔════════════════════════════════════════════════════════════╗${NC}"
echo -e "${GREEN}║${NC}  ${BLUE}Django Backend:${NC}    ${GREEN}http://localhost:8000${NC}           ${GREEN}║${NC}"
echo -e "${GREEN}║${NC}  ${BLUE}Next.js Frontend:${NC}   ${GREEN}http://localhost:3000${NC}           ${GREEN}║${NC}"
echo -e "${GREEN}║${NC}                                                              ${GREEN}║${NC}"
echo -e "${GREEN}║${NC}  ${YELLOW}Press Ctrl+C to stop all servers${NC}                      ${GREEN}║${NC}"
echo -e "${GREEN}╚════════════════════════════════════════════════════════════╝${NC}"
echo ""
echo -e "${BLUE}📋 Quick Links:${NC}"
echo -e "  • Django Pages (Bootstrap site): ${GREEN}http://localhost:8000${NC}"
echo -e "  • Next.js Landing Page:          ${GREEN}http://localhost:3000${NC}"
echo -e "  • Django Admin:                  ${GREEN}http://localhost:8000/admin${NC}"
echo -e "  • API Root:                      ${GREEN}http://localhost:8000/api${NC}"
echo ""

# Function to check server status
check_servers() {
    local django_running=false
    local nextjs_running=false

    if ps -p $DJANGO_PID > /dev/null 2>&1; then
        django_running=true
    fi

    if ps -p $NEXT_PID > /dev/null 2>&1; then
        nextjs_running=true
    fi

    echo -ne "\r${BLUE}Status: Django: [$([ "$django_running" = true ] && echo -e "${GREEN}●${NC}" || echo -e "${RED}○${NC}")]  Next.js: [$([ "$nextjs_running" = true ] && echo -e "${GREEN}●${NC}" || echo -e "${RED}○${NC}")]    "
}

# Monitor servers
while true; do
    check_servers

    # Check if either server died
    if ! ps -p $DJANGO_PID > /dev/null 2>&1; then
        echo ""
        echo -e "${RED}✗ Django backend stopped unexpectedly${NC}"
        cleanup
    fi

    if ! ps -p $NEXT_PID > /dev/null 2>&1; then
        echo ""
        echo -e "${RED}✗ Next.js frontend stopped unexpectedly${NC}"
        cleanup
    fi

    sleep 2
done

"""
ASGI config for GymBuddy project.
"""
import os
import sys
from pathlib import Path
# pyrefly: ignore [missing-import]
from django.core.asgi import get_asgi_application

# Add parent directory to path
BASE_DIR = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(BASE_DIR))

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'gymbuddy.settings')

application = get_asgi_application()

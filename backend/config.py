"""
Configuration module — loads environment variables on import.
All variables are optional. Users can provide keys via the UI instead.
"""

import os
from dotenv import load_dotenv

load_dotenv()

GEMINI_API_KEY = os.getenv("GEMINI_API_KEY", "") or None
GITHUB_TOKEN = os.getenv("GITHUB_TOKEN", "") or None
GITHUB_USERNAME = os.getenv("GITHUB_USERNAME", "") or None

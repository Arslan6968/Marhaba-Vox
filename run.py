#!/usr/bin/env python3
"""
Marhaba Vox — AI-Powered Vocal Separation Platform
Parent Brand: MarhabaPrinters
Launcher script
"""

import sys
import os
import webbrowser
import uvicorn
from pathlib import Path

# Ensure project root is in python path
ROOT_DIR = Path(__file__).resolve().parent
sys.path.insert(0, str(ROOT_DIR))

def main():
    print("=" * 60)
    print("  MARHABA VOX — AI-Powered Vocal Separation Platform")
    print("  Every Voice. Every Detail.")
    print("  Parent Brand: MarhabaPrinters")
    print("=" * 60)
    print("Starting backend and audio separation server...")
    print("API Documentation: http://127.0.0.1:8000/docs")
    print("Web Application:   http://127.0.0.1:8000")
    print("=" * 60)

    # Launch server
    uvicorn.run("backend.app.main:app", host="127.0.0.1", port=8000, reload=False)

if __name__ == "__main__":
    main()

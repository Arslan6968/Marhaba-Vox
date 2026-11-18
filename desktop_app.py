import os
import sys
import time
import json
import socket
import threading
import webbrowser
import urllib.request
import inspect
from pathlib import Path

# Setup persistent crash-proof logging for desktop application
class SafeStream:
    def __init__(self, fp=None):
        self.fp = fp
        self.encoding = "utf-8"
        self.errors = "replace"
        self.closed = False

    def write(self, s):
        if self.fp and not self.closed:
            try:
                self.fp.write(s)
                self.fp.flush()
            except Exception:
                pass

    def flush(self):
        if self.fp and not self.closed:
            try:
                self.fp.flush()
            except Exception:
                pass

    def isatty(self):
        return False

    def readable(self):
        return False

    def writable(self):
        return True

    def seekable(self):
        return False

log_dir = Path.home() / "AppData" / "Local" / "MarhabaVox" / "logs"
log_dir.mkdir(parents=True, exist_ok=True)
_log_fp = None
try:
    _log_fp = open(log_dir / "launcher.log", "a", buffering=1, encoding="utf-8")
except Exception:
    pass

sys.stdout = SafeStream(_log_fp)
sys.stderr = SafeStream(_log_fp)

# Set Windows Selector Event Loop to eliminate Proactor WinError 10054 connection resets
if sys.platform == "win32":
    import asyncio
    try:
        asyncio.set_event_loop_policy(asyncio.WindowsSelectorEventLoopPolicy())
    except Exception:
        pass
    try:
        import uvicorn.loops.asyncio
        uvicorn.loops.asyncio.asyncio_loop_factory = lambda use_subprocess=False: asyncio.SelectorEventLoop
    except Exception:
        pass

# Fix PyTorch inspect.getsource / _config_module in frozen PyInstaller environments
_orig_findsource = inspect.findsource
def _safe_findsource(obj):
    try:
        return _orig_findsource(obj)
    except (OSError, IOError, TypeError):
        if inspect.ismodule(obj):
            return ["# module source unavailable in frozen environment\n"], 0
        raise
inspect.findsource = _safe_findsource

try:
    import torch.utils._config_module as _cm
    _cm.get_assignments_with_compile_ignored_comments = lambda m: set()
except Exception:
    pass

# Add project root to sys.path
BASE_DIR = Path(__file__).resolve().parent
if str(BASE_DIR) not in sys.path:
    sys.path.insert(0, str(BASE_DIR))

# Ensure frozen environment paths & offline operation
if getattr(sys, "frozen", False):
    meipass = Path(getattr(sys, "_MEIPASS", ""))
    os.environ["MARHABA_VOX_FROZEN"] = "1"
    os.environ["HF_HUB_OFFLINE"] = "1"
    os.environ["TRANSFORMERS_OFFLINE"] = "1"
    
    # Point HF hub and torch cache to local app data so model is persistently cached
    cache_dir = Path.home() / "AppData" / "Local" / "MarhabaVox" / "cache"
    cache_dir.mkdir(parents=True, exist_ok=True)
    os.environ["HF_HOME"] = str(cache_dir / "huggingface")
    os.environ["TORCH_HOME"] = str(cache_dir / "torch")

    # If bundled model weights exist in MEIPASS or _internal, copy them to cache for 100% offline isolation
    bundled_hf = meipass / "models--adefossez--HTDemucs"
    if not bundled_hf.exists():
        bundled_hf = Path(sys.executable).parent / "_internal" / "models--adefossez--HTDemucs"
    target_hf = cache_dir / "huggingface" / "hub" / "models--adefossez--HTDemucs"
    if bundled_hf.exists() and not target_hf.exists():
        try:
            import shutil
            target_hf.parent.mkdir(parents=True, exist_ok=True)
            shutil.copytree(str(bundled_hf), str(target_hf))
        except Exception:
            pass
    
    # Bundle ffmpeg path into PATH
    for p in [meipass, Path(sys.executable).parent, Path(sys.executable).parent / "_internal"]:
        if (p / "ffmpeg.exe").exists():
            os.environ["PATH"] = str(p) + os.pathsep + os.environ.get("PATH", "")
            break

# Explicit imports for PyInstaller AST dependency analysis into PYZ-00.pyz (Source Code Protection)
import backend.app.main
import backend.app.core.config
import backend.app.audio.separator
import backend.app.audio.processor
import backend.app.audio.worker
import backend.app.api.health
import backend.app.api.files
import backend.app.api.history
import backend.app.api.jobs
import backend.app.api.models
import backend.app.api.settings
import backend.app.database.session
import backend.app.database.models
import backend.app.storage.manager

def is_marhaba_running(port: int = 8765) -> bool:
    """Checks if Marhaba Vox backend is already up and healthy."""
    try:
        url = f"http://127.0.0.1:{port}/api/v1/health"
        req = urllib.request.Request(url, headers={"User-Agent": "MarhabaVoxLauncher/1.0"})
        with urllib.request.urlopen(req, timeout=1.0) as resp:
            if resp.status == 200:
                data = json.loads(resp.read().decode("utf-8"))
                return data.get("app_name") == "Marhaba Vox"
    except Exception:
        pass
    return False

def find_free_port(preferred: int = 8765) -> int:
    """Checks if preferred port can actually be bound, otherwise finds an available dynamic port."""
    try:
        with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as s:
            s.bind(('127.0.0.1', preferred))
            return preferred
    except OSError:
        pass
    with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as s:
        s.bind(('127.0.0.1', 0))
        return s.getsockname()[1]

def wait_for_server(port: int, timeout: float = 30.0) -> bool:
    """Polls the local FastAPI health check until online and confirms it is Marhaba Vox."""
    url = f"http://127.0.0.1:{port}/api/v1/health"
    start = time.time()
    while time.time() - start < timeout:
        try:
            req = urllib.request.Request(url, headers={"User-Agent": "MarhabaVoxLauncher/1.0"})
            with urllib.request.urlopen(req, timeout=1.5) as resp:
                if resp.status == 200:
                    data = json.loads(resp.read().decode("utf-8"))
                    if data.get("app_name") == "Marhaba Vox":
                        return True
        except Exception:
            pass
        time.sleep(0.3)
    return False

def start_backend(port: int):
    """Starts FastAPI/Uvicorn server."""
    import uvicorn
    from backend.app.main import app
    uvicorn.run(app, host="127.0.0.1", port=port, log_level="warning")

def main():
    if is_marhaba_running(8765):
        print("[Marhaba Vox] Active instance detected on port 8765. Opening studio window...")
        launch_app_window("http://127.0.0.1:8765")
        sys.exit(0)

    port = find_free_port(8765)
    print("==================================================")
    print("  MARHABA VOX — Desktop Application")
    print(f"  Starting local AI audio studio on port {port}...")
    print("==================================================")

    # Start server in background thread
    server_thread = threading.Thread(target=start_backend, args=(port,), daemon=True)
    server_thread.start()

    # Wait for server to come online
    ready = wait_for_server(port)
    if not ready:
        print("[Error] Server failed to start within timeout.")
        sys.exit(1)

    app_url = f"http://127.0.0.1:{port}"
    print(f"[Marhaba Vox] Studio is live at: {app_url}")

    # Start background session monitor to detect when user closes the window
    monitor_thread = threading.Thread(target=monitor_session, daemon=True)
    monitor_thread.start()

    # Launch dedicated standalone desktop application window
    launch_app_window(app_url)
    
    # Keep application running while window/server is active
    try:
        while True:
            time.sleep(1)
    except KeyboardInterrupt:
        print("\n[Marhaba Vox] Shutting down application...")
        sys.exit(0)

def monitor_session():
    """Monitors client heartbeat and terminates when the window is closed."""
    # 60s initial grace period for browser window to launch, render, and start heartbeats
    time.sleep(60)
    from backend.app.api import health
    from backend.app.audio.worker import active_job_ids
    while True:
        time.sleep(3)
        if len(active_job_ids) == 0:
            # 1. Clean window close triggered by beforeunload beacon
            if getattr(health, "client_closed", False):
                time.sleep(3)
                if getattr(health, "client_closed", False):
                    print("[Marhaba Vox] Window closed by user. Exiting cleanly...")
                    os._exit(0)

            # 2. Inactivity timeout fallback (5 minutes of silence while idle)
            inactive_secs = time.time() - health.last_heartbeat_time
            if inactive_secs > 300:
                print(f"[Marhaba Vox] Studio inactive for {int(inactive_secs)}s without jobs. Cleanly exiting...")
                os._exit(0)

def launch_app_window(url: str):
    """
    Launches a dedicated standalone desktop application window.
    Uses Chromium/Edge App Mode (native to Windows 10/11) for zero-dependency, crash-free native windowing.
    Falls back to system default browser if needed.
    """
    import subprocess

    candidates = [
        Path(os.environ.get("ProgramFiles", "C:/Program Files")) / "Google" / "Chrome" / "Application" / "chrome.exe",
        Path(os.environ.get("ProgramFiles(x86)", "C:/Program Files (x86)")) / "Google" / "Chrome" / "Application" / "chrome.exe",
        Path(os.environ.get("LOCALAPPDATA", "")) / "Google" / "Chrome" / "Application" / "chrome.exe",
        Path(os.environ.get("ProgramFiles(x86)", "C:/Program Files (x86)")) / "Microsoft" / "Edge" / "Application" / "msedge.exe",
        Path(os.environ.get("ProgramFiles", "C:/Program Files")) / "Microsoft" / "Edge" / "Application" / "msedge.exe",
        Path(os.environ.get("LOCALAPPDATA", "")) / "Microsoft" / "Edge" / "Application" / "msedge.exe",
    ]

    launched = False
    profile_dir = Path.home() / "AppData" / "Local" / "MarhabaVox" / "browser_profile"
    profile_dir.mkdir(parents=True, exist_ok=True)

    for cand in candidates:
        if cand.exists():
            cmd = [
                str(cand),
                f"--app={url}",
                f"--user-data-dir={profile_dir}",
                "--window-size=1280,860",
                "--no-first-run",
                "--no-default-browser-check"
            ]
            try:
                # Use DEVNULL standard streams to prevent Windows GUI invalid handle crashes ([WinError 6])
                proc = subprocess.Popen(
                    cmd,
                    stdin=subprocess.DEVNULL,
                    stdout=subprocess.DEVNULL,
                    stderr=subprocess.DEVNULL,
                    close_fds=True
                )
                time.sleep(0.5)
                # Verify that the browser process didn't crash or abort immediately
                if proc.poll() is None:
                    launched = True
                    print(f"[Marhaba Vox] Launched app window via: {cand}")
                    break
                else:
                    print(f"[Marhaba Vox] Browser {cand.name} exited immediately (code {proc.poll()}), trying next...")
            except Exception as e:
                print(f"[Marhaba Vox] Browser launch failed for {cand} ({e}), trying next...")

    if not launched:
        print("[Marhaba Vox] Opening studio via system default browser...")
        webbrowser.open(url)

if __name__ == "__main__":
    main()

import os
import sys
import time
import socket
import threading
import webbrowser
import urllib.request
from pathlib import Path

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

def find_free_port(preferred: int = 8000) -> int:
    """Checks if preferred port is open, otherwise finds an available dynamic port."""
    with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as s:
        if s.connect_ex(('127.0.0.1', preferred)) != 0:
            return preferred
    with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as s:
        s.bind(('127.0.0.1', 0))
        return s.getsockname()[1]

def wait_for_server(port: int, timeout: float = 25.0) -> bool:
    """Polls the local FastAPI health check until online."""
    url = f"http://127.0.0.1:{port}/api/v1/health"
    start = time.time()
    while time.time() - start < timeout:
        try:
            req = urllib.request.Request(url, headers={"User-Agent": "MarhabaVoxLauncher/1.0"})
            with urllib.request.urlopen(req, timeout=1.0) as resp:
                if resp.status == 200:
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
    port = find_free_port(8000)
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

    # Attempt to open native window using pywebview if supported, fallback to system browser
    use_webview = True
    try:
        import webview
        icon_path = str(BASE_DIR / "app_icon.ico")
        if not Path(icon_path).exists() and getattr(sys, "frozen", False):
            icon_path = str(Path(getattr(sys, "_MEIPASS", "")) / "app_icon.ico")
        
        window = webview.create_window(
            title="Marhaba Vox — AI Audio Vocal Platform",
            url=app_url,
            width=1280,
            height=860,
            min_size=(960, 640),
            background_color="#F6F7FB",
            text_select=True
        )
        webview.start()
        print("[Marhaba Vox] Studio window closed. Cleanly terminating background processes...")
        sys.exit(0)
    except Exception as e:
        print(f"[Notice] Native window fallback to browser: {e}")
        use_webview = False

    if not use_webview:
        webbrowser.open(app_url)
        print("\nPress Ctrl+C in this window to stop Marhaba Vox.\n")
        try:
            while True:
                time.sleep(1)
        except KeyboardInterrupt:
            print("\nShutting down Marhaba Vox...")

if __name__ == "__main__":
    main()

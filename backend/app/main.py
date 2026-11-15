import os
import asyncio
from pathlib import Path
from contextlib import asynccontextmanager
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse, JSONResponse, Response

from .core.config import settings
from .database.session import init_db, SessionLocal
from .database.models import Job
from .audio.worker import start_queue_worker, stop_queue_worker, enqueue_job
from .audio.separator import demucs_separator
from .api import jobs, files, models, history, settings as api_settings, health

@asynccontextmanager
async def lifespan(app: FastAPI):
    print(f"==================================================")
    print(f"  {settings.PROJECT_NAME} — {settings.TAGLINE}")
    print(f"  Parent Brand: {settings.PARENT_BRAND}")
    print(f"==================================================")
    init_db()
    
    # Start smart background worker queue
    await start_queue_worker()

    # Pre-warm AI separation model in background so jobs start instantly without initial loading freeze
    asyncio.create_task(asyncio.to_thread(demucs_separator.load_model, "htdemucs"))

    # Automatically recover any interrupted jobs from previous sessions
    db = SessionLocal()
    try:
        interrupted = db.query(Job).filter(Job.status.in_(["waiting", "preparing", "separating", "exporting"])).all()
        for j in interrupted:
            j.status = "waiting"
            j.status_message = "Restored after restart. Queued for processing."
            db.commit()
            await enqueue_job(j.id)
        if interrupted:
            print(f"[Marhaba Vox Queue] Restored {len(interrupted)} interrupted job(s).")
    finally:
        db.close()

    yield

    # Gracefully stop queue worker
    await stop_queue_worker()
    print(f"Shutting down {settings.PROJECT_NAME}")

app = FastAPI(
    title=settings.PROJECT_NAME,
    description="AI-Powered Vocal Separation Platform — Every Voice. Every Detail.",
    version="1.0.0",
    lifespan=lifespan
)

# CORS configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Explicitly handle Chrome DevTools configuration request
@app.get("/.well-known/appspecific/com.chrome.devtools.json")
def chrome_devtools_json():
    return JSONResponse(content={})

# Handle favicon.ico gracefully
@app.get("/favicon.ico")
def favicon_ico():
    svg_icon = Path(__file__).resolve().parent.parent.parent / "frontend" / "public" / "favicon.svg"
    if svg_icon.exists():
        return FileResponse(str(svg_icon), media_type="image/svg+xml")
    dist_svg = Path(__file__).resolve().parent.parent.parent / "frontend" / "dist" / "favicon.svg"
    if dist_svg.exists():
        return FileResponse(str(dist_svg), media_type="image/svg+xml")
    return Response(status_code=204)

# Include API routers under /api/v1
app.include_router(health.router, prefix=settings.API_V1_STR)
app.include_router(models.router, prefix=settings.API_V1_STR)
app.include_router(jobs.router, prefix=settings.API_V1_STR)
app.include_router(files.router, prefix=settings.API_V1_STR)
app.include_router(history.router, prefix=settings.API_V1_STR)
app.include_router(api_settings.router, prefix=settings.API_V1_STR)

# Mount frontend production build if available
frontend_dist = Path(__file__).resolve().parent.parent.parent / "frontend" / "dist"
if frontend_dist.exists():
    app.mount("/assets", StaticFiles(directory=str(frontend_dist / "assets")), name="assets")

    @app.api_route("/{full_path:path}", methods=["GET", "HEAD"])
    async def serve_frontend(full_path: str):
        # 1. Do not catch API or documentation routes
        if full_path.startswith("api/") or full_path == "api" or full_path.startswith("docs") or full_path == "openapi.json":
            raise HTTPException(status_code=404, detail="API endpoint not found")
        
        # 2. Check if a static file is directly requested
        file_path = frontend_dist / full_path
        if file_path.exists() and file_path.is_file():
            return FileResponse(str(file_path))
        
        # 3. If a file extension is present (e.g. missing .json, .map, .png, etc.), return 404 rather than index.html
        if "." in Path(full_path).name or full_path.startswith(".well-known/"):
            raise HTTPException(status_code=404, detail=f"Static asset '{full_path}' not found")
        
        # 4. For SPA browser navigation routes, return index.html with strict no-cache headers to prevent stale chunk errors
        return FileResponse(
            str(frontend_dist / "index.html"),
            headers={
                "Cache-Control": "no-cache, no-store, must-revalidate",
                "Pragma": "no-cache",
                "Expires": "0"
            }
        )
else:
    @app.get("/")
    def root():
        return {
            "app": settings.PROJECT_NAME,
            "tagline": settings.TAGLINE,
            "brand": settings.PARENT_BRAND,
            "docs_url": "/docs",
            "api_v1": settings.API_V1_STR
        }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("backend.app.main:app", host="127.0.0.1", port=8000, reload=True)

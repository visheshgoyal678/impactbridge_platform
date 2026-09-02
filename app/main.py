import os
import socket
from contextlib import asynccontextmanager
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse, JSONResponse

from app.config import settings
from app.database.db import engine, Base, SessionLocal, auto_migrate_sqlite
from app.database.seed import seed_database

def get_local_ip():
    """Finds the local network IPv4 address for LAN/Mobile access."""
    s = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
    try:
        s.connect(('8.8.8.8', 80))
        ip = s.getsockname()[0]
    except Exception:
        ip = '127.0.0.1'
    finally:
        s.close()
    return ip

# Run SQLite auto migration first to ensure all columns exist
auto_migrate_sqlite()
Base.metadata.create_all(bind=engine)
_init_db = SessionLocal()
try:
    seed_database(_init_db)
finally:
    _init_db.close()

# Import existing routers
from app.routes.challenges import router as challenges_router
from app.routes.solutions import router as solutions_router
from app.routes.partnerships import router as partnerships_router
from app.routes.milestones import router as milestones_router
from app.routes.matching import router as matching_router
from app.routes.analytics import router as analytics_router
from app.routes.firebase_sync import router as firebase_router
from app.routes.ai_chat_routes import router as ai_chat_router

# Import CivicNexus routers
from app.routes.auth_routes import auth_router
from app.routes.student_routes import student_router
from app.routes.faculty_routes import faculty_router
from app.routes.industry_routes import industry_router
from app.routes.projects_routes import projects_router
from app.routes.discovery_routes import discovery_router
from app.routes.admin_routes import admin_router

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Lifespan context
    auto_migrate_sqlite()
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    try:
        seed_database(db)
    finally:
        db.close()
    yield

app = FastAPI(
    title=settings.APP_NAME,
    version=settings.APP_VERSION,
    lifespan=lifespan,
    description="CivicNexus — A digital innovation ecosystem connecting citizens, students, faculty, and industry partners to solve real-world community challenges."
)

# CORS Middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register API routers
app.include_router(challenges_router)
app.include_router(solutions_router)
app.include_router(partnerships_router)
app.include_router(milestones_router)
app.include_router(matching_router)
app.include_router(analytics_router)
app.include_router(firebase_router)

# Register CivicNexus modules
app.include_router(auth_router)
app.include_router(student_router)
app.include_router(faculty_router)
app.include_router(industry_router)
app.include_router(projects_router)
app.include_router(discovery_router)
app.include_router(admin_router)
app.include_router(ai_chat_router)

# Network Info endpoint for Mobile Phone connectivity & QR code
@app.get("/api/network-info")
def get_network_info():
    local_ip = get_local_ip()
    port = settings.PORT
    mobile_url = f"http://{local_ip}:{port}"
    qr_url = f"https://api.qrserver.com/v1/create-qr-code/?size=250x250&data={mobile_url}"
    return {
        "local_ip": local_ip,
        "port": port,
        "localhost_url": f"http://localhost:{port}",
        "mobile_url": mobile_url,
        "qr_code_url": qr_url
    }

# Mount static files
static_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), "static"))

@app.get("/static/{file_path:path}")
def serve_static(file_path: str):
    file_full = os.path.normpath(os.path.join(static_dir, file_path))
    if os.path.exists(file_full) and os.path.isfile(file_full):
        media_type = "application/javascript" if file_full.endswith(".js") else "text/css" if file_full.endswith(".css") else None
        return FileResponse(file_full, media_type=media_type)
    return JSONResponse(status_code=404, content={"detail": f"File {file_path} not found"})

app.mount("/static", StaticFiles(directory=static_dir, html=True), name="static")

@app.get("/")
def serve_index():
    index_file = os.path.join(static_dir, "index.html")
    return FileResponse(index_file)

@app.get("/citizen")
def serve_citizen():
    citizen_file = os.path.join(static_dir, "citizen.html")
    return FileResponse(citizen_file)

@app.get("/api/health")
def health_check():
    return {
        "status": "healthy",
        "app": settings.APP_NAME,
        "version": settings.APP_VERSION,
        "ecosystem": "CivicNexus Digital Innovation Ecosystem"
    }

# FastAPI
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from fastapi.staticfiles import StaticFiles
from authx.exceptions import AuthXException
import uvicorn
from src.api.router import main_router
from src.core.config import settings
from src.core.lifespan import lifespan
from src.version import __version__


# Create local media folders when the project is configured to store uploads on this server.
if settings.FILE_STORAGE_BACKEND == "local":
    settings.PUBLIC_STORAGE_DIR.mkdir(parents=True, exist_ok=True)
    settings.PRIVATE_STORAGE_DIR.mkdir(parents=True, exist_ok=True)


# Create the main API application and attach startup/shutdown tasks.
app = FastAPI(
    title="GrowCore API",
    version=__version__,
    lifespan=lifespan
)  # Create a FastAPI application instance


@app.exception_handler(AuthXException)
async def authx_exception_handler(request, exc):
    """Turns expired or invalid authentication tokens into one safe API response."""
    return JSONResponse(
        status_code=401,
        content={"detail": "Unauthorized"},
    )


# Add every feature router, such as products, users, cart, and orders.
app.include_router(main_router)


@app.get("/health", include_in_schema=False)
async def health_check():
    """Provides a small endpoint used by hosting services to check that the API is alive."""
    return {"status": "ok"}


# Allow the frontend origin to call this API and send authentication cookies.
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_methods=["*"],
    allow_headers=[
        "Content-Type",
        "Authorization",
        "X-CSRF-TOKEN",
        "X-Category-Secret",
    ],
    allow_credentials=True
)

if settings.FILE_STORAGE_BACKEND == "local":
    app.mount(
        settings.MEDIA_URL_PREFIX,
        StaticFiles(directory=str(settings.PUBLIC_STORAGE_DIR)),
        name="media",
    )


# Start a local development server only when this file is run directly.
if __name__ == "__main__":
    uvicorn.run("src.main:app", reload=True)

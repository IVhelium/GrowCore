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


if settings.FILE_STORAGE_BACKEND == "local":
    settings.PUBLIC_STORAGE_DIR.mkdir(parents=True, exist_ok=True)
    settings.PRIVATE_STORAGE_DIR.mkdir(parents=True, exist_ok=True)


app = FastAPI(
    title="GrowCore API",
    lifespan=lifespan
)  # Create a FastAPI application instance


@app.exception_handler(AuthXException)
async def authx_exception_handler(request, exc):
    return JSONResponse(
        status_code=401,
        content={"detail": "Unauthorized"},
    )


app.include_router(main_router)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_methods=["*"],
    allow_headers=["Content-Type", "Authorization"],
    allow_credentials=True
)

if settings.FILE_STORAGE_BACKEND == "local":
    app.mount(
        settings.MEDIA_URL_PREFIX,
        StaticFiles(directory=str(settings.PUBLIC_STORAGE_DIR)),
        name="media",
    )


# Configure the server to run on localhost
if __name__ == "__main__":
    uvicorn.run("src.main:app", reload=True)

# FastAPI
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from fastapi.staticfiles import StaticFiles
from authx.exceptions import AuthXException
import uvicorn
from contextlib import asynccontextmanager
from src.api import main_router
from src.core.config import settings
from src.core.constants import ORIGINS
from src.core.database import new_session
from src.utils.seed_roles import seed_roles


settings.PUBLIC_STORAGE_DIR.mkdir(parents=True, exist_ok=True)
settings.PRIVATE_STORAGE_DIR.mkdir(parents=True, exist_ok=True)


# ========= Lifespan =========
@asynccontextmanager
async def lifespan(app: FastAPI):
    async with new_session() as db:
        await seed_roles(db)
    yield


app = FastAPI(lifespan=lifespan)  # Create a FastAPI application instance


@app.exception_handler(AuthXException)
async def authx_exception_handler(request, exc):
    return JSONResponse(
        status_code=401,
        content={"detail": "Unauthorized"},
    )


app.include_router(main_router)

app.add_middleware(
    CORSMiddleware,
    allow_origins=ORIGINS,
    allow_methods=["*"],
    allow_headers=["Content-Type", "Authorization"],
    allow_credentials=True
)

app.mount(
    settings.MEDIA_URL_PREFIX,
    StaticFiles(directory=str(settings.PUBLIC_STORAGE_DIR)),
    name="media",
)


# Configure the server to run on localhost
if __name__ == "__main__":
    uvicorn.run("src.main:app", reload=True)

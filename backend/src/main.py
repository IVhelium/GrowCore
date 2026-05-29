# FastAPI
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
import uvicorn
from contextlib import asynccontextmanager
from src.api import main_router
from src.core.constants import PUBLIC_STORAGE_DIR, PRIVATE_STORAGE_DIR, AVATAR_DIR, ORIGINS
from src.core.database import new_session
from src.utils.seed_roles import seed_roles


PUBLIC_STORAGE_DIR.mkdir(parents=True, exist_ok=True)
PRIVATE_STORAGE_DIR.mkdir(parents=True, exist_ok=True)
AVATAR_DIR.mkdir(parents=True, exist_ok=True)


# ========= Lifespan =========
@asynccontextmanager
async def lifespan(app: FastAPI):
    async with new_session() as db:
        await seed_roles(db)
    yield


app = FastAPI(lifespan=lifespan)  # Create a FastAPI application instance

app.include_router(main_router)

app.add_middleware(
    CORSMiddleware,
    allow_origins=ORIGINS,
    allow_methods=["*"],
    allow_headers=["Content-Type", "Authorization"],
    allow_credentials=True
)

app.mount(
    "/storage/avatars",
    StaticFiles(directory=str(AVATAR_DIR)),
    name="avatars",    
)


# Configure the server to run on localhost
if __name__ == "__main__":
    uvicorn.run("src.main:app", reload=True)
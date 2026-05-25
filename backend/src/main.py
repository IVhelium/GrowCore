# FastAPI
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
import uvicorn
from contextlib import asynccontextmanager
from backend.src.api import main_router
from backend.src.core.constants import AVATAR_DIR, ORIGINS
from backend.src.core.database import new_session
from backend.src.utils.seed_roles import seed_roles


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
    allow_headers=["*"],
    allow_credentials=True
)

app.mount(
    "/media/avatars",
    StaticFiles(directory=str(AVATAR_DIR)),
    name="avatars",    
)


# Configure the server to run on localhost
if __name__ == "__main__":
    uvicorn.run("backend.src.main:app", reload=True)
# FastAPI
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import uvicorn
from contextlib import asynccontextmanager
from src.api import main_router
from src.core.database import new_session
from src.utils.seed_roles import seed_roles


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
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# Configure the server to run on localhost
if __name__ == "__main__":
    uvicorn.run("src.main:app", reload=True)
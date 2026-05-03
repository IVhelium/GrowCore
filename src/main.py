# FastAPI
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import uvicorn
from src.api import main_router


app = FastAPI()  # Create a FastAPI application instance

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

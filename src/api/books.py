from logging import config
from fastapi import FastAPI, HTTPException, Response, Depends, BackgroundTasks, File, UploadFile, APIRouter, security
from fastapi.responses import StreamingResponse, FileResponse
from sqlalchemy import Engine, select

from src.dependencies import SessionDependency
from src.database import Base, engine
from src.models.books import BookModel
from src.schemas.books import NewBookSchema


router = APIRouter()


# Get all books
@router.get("/books", tags=["Books"], summary="Get all books")
async def get_books(session: SessionDependency):
    query = select(BookModel)
    
    result = await session.execute(query)
    
    return result.scalars().all()  # Return all books as a list of BookModel instances
    

@router.post("/books", tags=["Books"], summary="Add a new book")
async def add_book(book: NewBookSchema, session: SessionDependency):
    new_book = BookModel(
        title=book.title,
        author=book.author,
    )
    session.add(new_book)
    
    await session.commit()
    
    return {"success": True, "message": "Book added successfully"}  # Return a success message after adding the book


@router.post("/files")
async def upload_file(uploaded_file: UploadFile):
    file = uploaded_file.file
    file_name = uploaded_file.filename
    
    with open(f"f1_{file_name}", "wb") as f:
        f.write(file.read())
        
    return {"message": "File uploaded successfully"}
  
        
@router.post("/multiple_files")
async def upload_files(uploaded_files: list[UploadFile]):
    for uploaded_file in uploaded_files:
        file = uploaded_file.file
        file_name = uploaded_file.filename
        
        with open(f"f1_{file_name}", "wb") as f:
            f.write(file.read())
    
    return {"message": "Files uploaded successfully"}


@router.get("/files/{file_name}")  # Get local file by name
async def get_file(file_name: str):
    return FileResponse(file_name)


def iter_file(file_name: str):  # Generator function to read a file in chunks for streaming
    with open(file_name, "rb") as file:
        while chunk := file.read(1024 * 1024):
            yield chunk

@router.get("/stream_file/{file_name}")
async def get_streaming_file(file_name: str):
    return StreamingResponse(iter_file(file_name), media_type="video/mp4")
# FastAPI
from fastapi import FastAPI, HTTPException, Response, Depends, BackgroundTasks, File, UploadFile
import uvicorn

# Pydantic
from pydantic import BaseModel, Field, EmailStr, ConfigDict

# SQLAlchemy
from sqlalchemy.ext.asyncio import create_async_engine, async_sessionmaker, AsyncSession
from sqlalchemy import select
from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column

# Authx
from authx import AuthX, AuthXConfig

# Typing
from typing_extensions import Annotated

# Time
import time

# Asyncio
import asyncio


# ================================================================================================================ #


app = FastAPI() # Create a FastAPI application instance


@app.post("/files")
async def upload_file(uploaded_file: UploadFile):
    file = uploaded_file.file
    file_name = uploaded_file.filename
    
    with open(f"f1_{file_name}", "wb") as f:
        f.write(file.read())
        
    return {"message": "File uploaded successfully"}
  
        
@app.post("/multiple_files")
async def upload_files(uploaded_files: list[UploadFile]):
    for uploaded_file in uploaded_files:
        file = uploaded_file.file
        file_name = uploaded_file.filename
        
        with open(f"f1_{file_name}", "wb") as f:
            f.write(file.read())
    
    return {"message": "Files uploaded successfully"}

# # Background tasks example
# def sync_task():
#     time.sleep(3)
#     print("Email otpravlen")
    
# async def async_task():
#     await asyncio.sleep(3)
#     print("Email otpravlen async")
    

# @app.get("/")
# async def some_route(background_tasks: BackgroundTasks):
#     asyncio.create_task(async_task()) # Schedule the async task to run in the background
#     background_tasks.add_task(sync_task)
#     return {"ok": True}   


# # Registration
# config = AuthXConfig()

# config.JWT_SECRET_KEY = "nigga"
# config.JWT_ACCESS_COOKIE_NAME = "my_access_token"
# config.JWT_TOKEN_LOCATION = ["cookies"]

# security = AuthX(config=config)


# class UserLoginSchema(BaseModel):
#     username: str
#     password: str


# @app.post("/login")
# def login(credentials: UserLoginSchema, response: Response):
#     if credentials.username == "test" and credentials.password == "test":
#         token = security.create_access_token(uid="1234")  # Create an access token with a user ID of 1234
#         response.set_cookie(config.JWT_ACCESS_COOKIE_NAME, token)
#         return {"access_token": token}  
#     raise HTTPException(status_code=401, detail="Invalid username or password")
    

# @app.get("/protected", dependencies=[Depends(security.access_token_required)])
# def protected():
#     return {"message": "You have accessed a protected route!"}


# # Create database connection and session management
# engine = create_async_engine('sqlite+aiosqlite:///books.db')  # Create an async engine for connecting to a SQLite database

# new_session = async_sessionmaker(engine, expire_on_commit=False)  # Create an async sessionmaker for managing database

# async def get_session():
#     async with new_session() as session:
#         yield session
        
# SessionDependency = Annotated[AsyncSession, Depends(get_session)]

# class Base(DeclarativeBase):
#     pass


# class BookModel(Base):  # Create model for table books
#     __tablename__ = "books"  # Define the name of the database table for books
    
#     id: Mapped[int] = mapped_column(primary_key=True)
#     title: Mapped[str]
#     author: Mapped[str]


# @app.post("/setup_database")

# async def setup_database():
#     async with engine.begin() as connection:
#         await connection.run_sync(Base.metadata.drop_all)
#         await connection.run_sync(Base.metadata.create_all)
        
#     return {"success": True, "message": "Database setup completed successfully"}
    
    
# # Add a new book
# class NewBookSchema(BaseModel):   # Define the data model for a new book, for validation purposes
#     title: str | None = Field(max_length=100)   # Title is a required field with a length constraint
#     author: str | None
    
#     model_config = ConfigDict(extra="forbid")   # Forbid extra fields not defined in the model
    
# class BookSchema(NewBookSchema):
#     id: int
    

# # Get all books
# @app.get("/books", tags=["Books"], summary="Get all books")

# async def get_books(session: SessionDependency):
#     query = select(BookModel)
    
#     result = await session.execute(query)
    
#     return result.scalars().all()  # Return all books as a list of BookModel instances
    


# # Get book by id
# @app.get("/books/{book_id}", tags=["Books"], summary="Get book by id")

# async def get_book(book_id: int):
#     ...
    

# @app.post("/books", tags=["Books"], summary="Add a new book")

# async def add_book(book: NewBookSchema, session: SessionDependency):
#     new_book = BookModel(
#         title=book.title,
#         author=book.author,
#     )
#     session.add(new_book)
    
#     await session.commit()
    
#     return {"success": True, "message": "Book added successfully"}  # Return a success message after adding the book



# Configure the server to run on localhost
if __name__ == "__main__":
    uvicorn.run("main:app", reload=True)
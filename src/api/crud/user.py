from sqlalchemy import select
from src.core.dependencies import SessionDependency
from src.models import UserModel
from src.schemas import CreateUserDTO


# GET
async def get_user_by_email(db: SessionDependency, email: str):
    query = await db.execute(
        select(UserModel)
        .where(UserModel.email == email)
    )
    
    return query.scalar_one_or_none()

# POST
async def create_user(db: SessionDependency, user: CreateUserDTO):
    new_user = UserModel(
        username=user.username,
        email=user.email,
        password_hash=user.password
    )
    
    db.add(new_user)
    
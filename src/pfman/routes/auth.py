from fastapi import APIRouter, HTTPException

from pfman.models import User

auth_router = APIRouter()

@auth_router.get("/me")
def get_user_profile() -> User:
    return User(
        id="user1234",
        first_name="Jane",
        last_name="Spoonfighter",
        email="janspoon@fighter.dev",
        picture="https://raw.githubusercontent.com/mantinedev/mantine/master/.demo/avatars/avatar-5.png",
    )

@auth_router.get("/{path:path}")
def not_found():
    raise HTTPException(status_code=404, detail="Not Found")

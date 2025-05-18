from typing import Optional

from pydantic import BaseModel, Field


class User(BaseModel):
    id: str = Field(description="The user ID")
    first_name: Optional[str] = Field(default=None, description="The user's first name")
    last_name: Optional[str] = Field(default=None, description="The user's last name")
    email: str = Field(description="The user's email address")
    picture: Optional[str] = Field(description="The user's profile picture URL")
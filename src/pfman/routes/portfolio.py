from typing import List, Optional
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field

from pfman.models import Address

portfolio_router = APIRouter()


@portfolio_router.get("/")
def get_portfolios():
    pass


class CreatePortfolioPayload(BaseModel):
    title: str = Field(description="The portfolio title")
    description: Optional[str] = Field(
        default=None, description="The portfolio description"
    )
    properties: List[Address] = Field(
        description="The addresses to include in the portfolio"
    )


@portfolio_router.post("/")
def create_portfolio(body: CreatePortfolioPayload):
    pass


@portfolio_router.get("/{id}")
def get_portfolio(id: str):
    pass


@portfolio_router.get("/{path:path}")
def not_found():
    raise HTTPException(status_code=404, detail="Not Found")

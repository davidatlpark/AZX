from fastapi import APIRouter, HTTPException, Depends

from .auth import auth_router
from .portfolio import portfolio_router

api_router = APIRouter()

api_router.include_router(auth_router, prefix="/auth")
api_router.include_router(portfolio_router, prefix="/portfolio")

@api_router.get("/{path:path}")
def not_found():
    raise HTTPException(status_code=404, detail="Not Found")

from contextlib import asynccontextmanager
from datetime import timedelta
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.gzip import GZipMiddleware
from fastapi.requests import Request
from fastapi.staticfiles import StaticFiles
from fastapi.templating import Jinja2Templates
from loguru import logger
from pathlib import Path
from pfman.Env import config
from pfman.logging import configure_log_level, configure_neo4j_log_level
from pfman.routes.api import api_router
from starlette.middleware.sessions import SessionMiddleware
import os


logger.info("Validating environment variables")
config.validate(raise_on_fail=True)
logger.info(f"Configuring logging, setting level to {config.LOG_LEVEL}")
configure_log_level(config.LOG_LEVEL)
logger.info(f"Configuring Neo4j logging, setting level to {config.NEO4J_LOG_LEVEL}")
configure_neo4j_log_level(config.NEO4J_LOG_LEVEL)

root = Path(__file__).parent.parent

templates = Jinja2Templates(directory=f"{root}/client/dist")


@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info("Starting up...")
    # Startup code here
    yield
    logger.info("Shutting down...")
    # Shutdown code here


app = FastAPI(
    title="PFMan",
    description="A FastAPI application for managing Commercial Real Estate Portfolios",
    version="1.0.0",
    debug=config.DEBUG,
    lifespan=lifespan,
)

app.add_middleware(
    SessionMiddleware,
    secret_key=config.SESSION_SECRET,
    max_age=int(timedelta(days=7).total_seconds()),
)

app.add_middleware(GZipMiddleware, minimum_size=500)

client_dist = f"{root}/client/dist"
os.makedirs(client_dist, exist_ok=True)
client_assets = f"{root}/client/dist/assets"
os.makedirs(client_assets, exist_ok=True)
client_locales = f"{root}/client/dist/locales"
os.makedirs(client_locales, exist_ok=True)
client_templates = f"{root}/client/dist/templates"
os.makedirs(client_templates, exist_ok=True)

app.mount("/static", StaticFiles(directory=client_dist), name="static")
app.mount("/assets", StaticFiles(directory=client_assets), name="assets")
app.mount("/locales", StaticFiles(directory=client_locales), name="locales")
app.mount("/templates", StaticFiles(directory=client_templates), name="templates")

app.include_router(api_router, prefix="/api")


@app.get("/{rest_of_path:path}")
async def react_app(req: Request, rest_of_path: str):
    return templates.TemplateResponse("index.html", {"request": req})


if __name__ == "__main__":
    import uvicorn

    uvicorn.run(app, host="0.0.0.0", port=8000)

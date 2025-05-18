import os
from pathlib import Path
from typing import List, Literal, Optional
from loguru import logger
from dotenv import load_dotenv
from neomodel import config as neoconfig
import logging


class Env:
    @staticmethod
    def get(key: str, default: Optional[str] = None) -> str:
        value = os.getenv(key)
        if value:
            return value

        if default is None:
            raise ValueError(f"{key} environment variable not set")

        return default

    @staticmethod
    def try_get(key: str, default: Optional[str] = None) -> Optional[str]:
        return os.getenv(key, default)

    @staticmethod
    def get_int(key: str) -> int | None:
        int_str = os.getenv(key)
        return int(int_str) if int_str else None

    @staticmethod
    def get_float(key: str) -> float | None:
        float_str = os.getenv(key)
        return float(float_str) if float_str else None

    @staticmethod
    def get_bool(key: str) -> bool:
        bool_str = os.getenv(key)
        return bool_str.lower() in ["t", "true", "1"] if bool_str else False

    @staticmethod
    def try_get_bool(key: str, default: bool):
        bool_str = os.getenv(key)
        if bool_str is None:
            return default
        return bool_str.lower() in ["t", "true", "1"]

    @staticmethod
    def get_list(key: str) -> list | None:
        list_str = os.getenv(key)
        return list_str.split(",") if list_str else None

    @staticmethod
    def get_dict(key: str) -> dict | None:
        dict_str = os.getenv(key)
        return (
            dict(item.split("=") for item in dict_str.split(",")) if dict_str else None
        )

    @staticmethod
    def get_tuple(key: str) -> tuple | None:
        tuple_str = os.getenv(key)
        return tuple(tuple_str.split(",")) if tuple_str else None

    @staticmethod
    def get_set(key: str) -> set:
        set_str = os.getenv(key)
        return set(set_str.split(",")) if set_str else set()

    @staticmethod
    def get_bytes(key: str) -> bytes | None:
        bytes_str = os.getenv(key)
        return bytes(bytes_str, "utf-8") if bytes_str else None

    @staticmethod
    def get_bytearray(key: str) -> bytearray | None:
        bytes_str = os.getenv(key)
        return bytearray(bytes_str, "utf-8") if bytes_str else None

    def __init__(self, env: str):
        self.ENV = env
        self.DEV = not production and env == "dev"
        self.PROD = production or env == "prod"
        self.TEST = not production and env == "test"
        self.DEBUG = Env.try_get_bool("DEBUG", self.DEV)

        self.NEO4J_URL = Env.get("NEO4J_URL")
        self.NEO4J_DB = Env.get("NEO4J_DB", "neo4j")
        self.NEO4J_USERNAME = Env.get("NEO4J_USERNAME", "neo4j")
        self.NEO4J_PASSWORD = Env.get("NEO4J_PASSWORD")
        self.NEO4J_CONNECTION_STRING = Env.get("NEO4J_CONNECTION_STRING")
        self.REDIS_URL = Env.get("REDIS_URL")
        self.REDIS_PASSWORD = Env.get("REDIS_PASSWORD")
        self.SESSION_SECRET = Env.get("SESSION_SECRET")
        self.SITE_URL = Env.get("SITE_URL")

        self.NEO4J_LOG_LEVEL = logging.getLevelNamesMapping().get(
            Env.get("NEO4J_LOG_LEVEL", "ERROR").upper(), "ERROR"
        )

        self.LOG_LEVEL: Literal["DEBUG", "INFO", "WARNING", "ERROR", "CRITICAL"] = (
            Env.get(
                "LOGURU_LEVEL",
                "DEBUG" if self.DEBUG else "WARNING" if self.PROD else "INFO",
            )
        )  # type: ignore

        # Setting neoconfig here on Env creation
        neoconfig.DATABASE_URL = self.NEO4J_CONNECTION_STRING

        logger.info(f"Initialized environment variables for {env} environment")

    def validate(self, raise_on_fail: bool = True) -> List[str]:
        errors = []
        if not self.NEO4J_URL:
            errors.append("NEO4J_URL is not set")
        if not self.NEO4J_USERNAME:
            errors.append("NEO4J_USERNAME is not set")
        if not self.NEO4J_PASSWORD:
            errors.append("NEO4J_PASSWORD is not set")
        if not self.NEO4J_DB:
            errors.append("NEO4J_DB is not set")
        if not self.NEO4J_CONNECTION_STRING:
            errors.append("Neo4j connection string is not set")

        if not self.REDIS_URL:
            errors.append("REDIS_URL is not set")
        if not self.REDIS_PASSWORD:
            errors.append("REDIS_PASSWORD is not set")

        if not self.SESSION_SECRET:
            errors.append("SESSION_SECRET is not set")
        if not self.SITE_URL:
            errors.append("SITE_URL is not set")

        if self.ENV and self.ENV not in ["dev", "prod", "test"]:
            errors.append("ENV must be 'dev', 'prod', or 'test'")

        if errors:
            logger.error(
                f"Environment variables validation failed:{os.linesep}{os.linesep.join(errors)}"
            )
            if raise_on_fail:
                raise ValueError(
                    f"Environment variables validation failed: {os.linesep}{os.linesep.join(errors)}"
                )

        if self.DEBUG:
            logger.debug("Running in debug mode")

        return errors


env = Env.get("ENV", "dev")

logger.info(f"Running in {env} environment")

production = Env.get_bool("PRODUCTION") or env == "prod"

if production:
    logger.info(f"Running in production: {production}")

BASE_DIR = Path(__file__).resolve().parent.parent.parent

env_files = (
    [
        BASE_DIR / ".env",
        BASE_DIR / ".env.local",
        BASE_DIR / f".env.{env}",
        BASE_DIR / f".env.{env}.local",
    ]
    if env
    else [BASE_DIR / ".env", BASE_DIR / ".env.local"]
)

for env_file in env_files:
    if os.path.exists(env_file):
        logger.info(f"Loading environment variables from {env_file}")
        try:
            load_dotenv(env_file, override=True)
        except FileNotFoundError:
            logger.warning(f"{env_file} not found")
    else:
        logger.warning(f"{env_file} not found")


config = Env(env)

# intercept all logs and send it over to loguru
from loguru import logger


# Step 1: Define the intercept handler
class InterceptHandler(logging.Handler):
    def emit(self, record):
        # Try to get Loguru log level from record
        try:
            level = logger.level(record.levelname).name
        except ValueError:
            level = record.levelno

        # Forward to Loguru
        logger.opt(depth=6, exception=record.exc_info).log(level, record.getMessage())


# Step 2: Remove existing handlers on root logger and attach InterceptHandler
logging.root.handlers = []
logging.root.setLevel(logging.NOTSET)
logging.basicConfig(handlers=[InterceptHandler()], level=0, force=True)

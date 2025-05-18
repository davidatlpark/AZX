import logging
import sys
from typing import Literal
from pfman.Env import config
from loguru import logger as guru_logger

logger = guru_logger

def configure_log_level(
    level: Literal["DEBUG", "INFO", "WARNING", "ERROR", "CRITICAL"] = config.LOG_LEVEL,
):
    logger.remove()
    logger.add(
        sys.stderr,
        level=level,
        colorize=config.DEBUG or not config.PROD,
    )

def configure_neo4j_log_level(level: int | str = config.NEO4J_LOG_LEVEL):
    logging.getLogger("neo4j").setLevel(level)
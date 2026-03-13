from functools import lru_cache
import os

from dotenv import load_dotenv

load_dotenv()


class Settings:
    def __init__(self) -> None:
        self.PROJECT_NAME = os.getenv("PROJECT_NAME", "StudySense")
        self.API_V1_STR = os.getenv("API_V1_STR", "/api/v1")
        self.DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./app.db")


@lru_cache
def get_settings() -> Settings:
    return Settings()

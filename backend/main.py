from fastapi import FastAPI
from app.api.v1.router import api_router

app = FastAPI(title="StudySense API")

app.include_router(api_router)
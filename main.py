from contextlib import asynccontextmanager
from fastapi import FastAPI
from database import engine
import models
from itr import load_datadragon_mappings, CORE_QUEUES
from router import router  # Import 'router' directly from router.py

models.Base.metadata.create_all(bind=engine)

@asynccontextmanager
async def lifespan(app: FastAPI):
    await load_datadragon_mappings()
    yield

app = FastAPI(
    title="League of Legends Core Analytics Backend",
    lifespan=lifespan
)

app.include_router(router)

@app.get("/")
def read_root():
    return {
        "status": "Backend server is online!",
        "supported_core_queues": CORE_QUEUES,
    }
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from .detect_people import detect_people

app = FastAPI()

# IZINKAN FRONTEND AKSES
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://127.0.0.1:3000",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/health")
def health():
    return {
        "message": "Computer vision service is running",
        "data": {
            "status": "ok"
        }
    }


@app.post("/detect")
async def detect(request: Request):
    image_bytes = await request.body()
    result = detect_people(image_bytes if image_bytes else None)

    return {
        "message": "Detection completed",
        "data": result
    }

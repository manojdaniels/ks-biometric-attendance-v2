from fastapi import FastAPI
from contextlib import asynccontextmanager
import subprocess
import uvicorn
import os
from dotenv import load_dotenv
load_dotenv()

process = None  # Global variable for background process

@asynccontextmanager
async def lifespan(app: FastAPI):
    global process
    try:
        # Startup logic
        os.makedirs("logs", exist_ok=True)
        logfile = open("logs/modeltry1.log", "a")
        process = subprocess.Popen(
            ["python", "modeltry1.py"],
            stdout=logfile,
            stderr=logfile
        )
        print("modeltry2.py started automatically")
        yield  # This is where the app runs
    finally:
        # Shutdown logic
        if process:
            process.terminate()
            print("modeltry2.py terminated")

app = FastAPI(lifespan=lifespan)
@app.get("/")
def home():
    return {"message": "Recognition service is running"}

@app.get("/status")
def status():
    if process and process.poll() is None:
        return {"status": "Running"}
    else:
        return {"status": "Stopped"}
port=int(os.getenv("CAMERA_PORT"))
if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=port)

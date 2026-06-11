
from fastapi import FastAPI
from contextlib import asynccontextmanager
import logging
import threading
import json
import os
import queue
from pathlib import Path
from dotenv import load_dotenv
import uvicorn
from paho.mqtt import client as mqtt_client

# Import training logic (which uses InsightFace)
from train_model import train_model

# Configure logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

load_dotenv(override=True)

# Configuration
BROKER = os.getenv("MQTT_BROKER", "localhost")
PORT = int(os.getenv("MQTT_PORT", 1883))
USERNAME = os.getenv("MQTT_BROKER_USERNAME", "")
PASSWORD = os.getenv("MQTT_BROKER_PASSWORD", "")
TOPIC = os.getenv("TOPIC", "attendance/train")
EMBEDDINGS_FILE = os.getenv("EMBEDDINGS", "face_embeddings.npz")
TRAINING_DIR = os.getenv("TRAINING_DIR", "training_images")
TRAIN_PORT = int(os.getenv("TRAIN_PORT", 8001))

# Global state
mqtt_thread = None
stop_event = threading.Event()
client = None

def on_connect(client, userdata, flags, rc):
    if rc == 0:
        logger.info("Connected to MQTT Broker!")
        client.subscribe(TOPIC)
    else:
        logger.error(f"Failed to connect, return code {rc}")

def on_message(client, userdata, msg):
    try:
        payload = msg.payload.decode()
        logger.info(f"Received message: {payload}")
        data = json.loads(payload)
        
        msg_type = data.get("type")
        
        if msg_type == "train":
            # Determine training directory
            # If uploadPath is provided, try to find the root.
            # But robustly, we should just use the configured TRAINING_DIR 
            # and re-index everything to ensure consistency.
            # However, if the user explicitly wants to train a sub-part, 
            # we can try to interpret the path.
            
            target_dir = TRAINING_DIR
            if "uploadPath" in data:
                 # Check if the provided path is valid
                 p = data["uploadPath"]
                 # If it's a file, get dir
                 if os.path.isfile(p):
                     # If it's .../John/img.jpg, dir is .../John
                     # But train_model iterates subdirs of the root.
                     # So we should pass the ROOT.
                     # Assuming standard structure: root/Person/Image
                     # So root is dirname(dirname(p))
                     possible_root = os.path.dirname(os.path.dirname(p))
                     if os.path.exists(possible_root):
                        # We stick to global TRAINING_DIR for safety unless overridden
                        pass
            
            logger.info(f"Starting training on {target_dir}...")
            # Run in a separate thread/executor to avoid blocking the MQTT loop for too long
            # (though paho runs on_message in its own thread usually)
            try:
                train_model(target_dir, EMBEDDINGS_FILE)
                logger.info("Training completed successfully.")
            except Exception as e:
                logger.error(f"Training failed: {e}")
                
        elif msg_type == "camera":
            # Save camera URLs
            cameras = data.get("cameras", [])
            with open("camera_urls.json", "w") as f:
                json.dump(cameras, f, indent=2)
            logger.info(f"Updated camera_urls.json with {len(cameras)} cameras.")
            
    except json.JSONDecodeError:
        logger.error("Failed to decode JSON payload")
    except Exception as e:
        logger.error(f"Error processing message: {e}")

def run_mqtt():
    global client
    client = mqtt_client.Client()
    if USERNAME and PASSWORD:
        client.username_pw_set(USERNAME, PASSWORD)
    
    client.on_connect = on_connect
    client.on_message = on_message
    
    try:
        logger.info(f"Connecting to MQTT broker at {BROKER}:{PORT}...")
        client.connect(BROKER, PORT)
        client.loop_start() # Starts a background thread for network loop
        
        # Wait for stop event
        stop_event.wait()
        
        client.loop_stop()
        client.disconnect()
        logger.info("MQTT Client disconnected.")
    except Exception as e:
        logger.error(f"MQTT connection failed: {e}")

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup
    global mqtt_thread
    logger.info("Starting Training Service...")
    
    # Start MQTT Handler in background thread (to keep it persistent)
    # Note: loop_start() creates a thread, but we need a wrapper if we wanted strict control,
    # but strictly speaking, we can just call loop_start() here.
    # However, let's keep the run_mqtt structure for cleanliness if we wanted to enforce logic.
    # Actually, standard paho usage:
    global client
    client = mqtt_client.Client()
    if USERNAME and PASSWORD:
        client.username_pw_set(USERNAME, PASSWORD)
    client.on_connect = on_connect
    client.on_message = on_message
    
    try:
        client.connect(BROKER, PORT)
        client.loop_start() 
        logger.info("MQTT Listener started.")
    except Exception as e:
        logger.error(f"Failed to start MQTT: {e}")

    yield
    
    # Shutdown
    logger.info("Shutting down...")
    if client:
        client.loop_stop()
        client.disconnect()

app = FastAPI(lifespan=lifespan)

@app.get("/")
def home():
    return {"message": "InsightFace Training Service Running", "type": "insightface"}

@app.get("/train")
def trigger_train_manual():
    """Manual trigger for training via HTTP"""
    try:
        # Run synchronous training in background? For fast response.
        # But for simplicity, let's run it here (blocking this request)
        train_model(TRAINING_DIR, EMBEDDINGS_FILE)
        return {"status": "success", "message": "Training completed"}
    except Exception as e:
        return {"status": "error", "message": str(e)}

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=TRAIN_PORT)

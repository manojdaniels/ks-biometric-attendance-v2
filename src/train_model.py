# Changes for : Moved gpu_utils import to the top to inject NVIDIA DLLs before onnxruntime loads : code updated by MD!!
import gpu_utils # MUST BE FIRST
import os
import cv2
import numpy as np
import logging
from dotenv import load_dotenv

# Set log level
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

load_dotenv()

# Configuration
TRAINING_DIR_NAME = os.getenv("TRAINING_IMAGE_PATH", "Training_images")

# Smart path resolution: Check CWD, then Parent, then Absolute
if os.path.exists(TRAINING_DIR_NAME):
    TRAINING_DIR = TRAINING_DIR_NAME
elif os.path.exists(os.path.join("..", TRAINING_DIR_NAME)):
    TRAINING_DIR = os.path.join("..", TRAINING_DIR_NAME)
elif os.path.exists(os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), TRAINING_DIR_NAME)):
     TRAINING_DIR = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), TRAINING_DIR_NAME)
else:
    TRAINING_DIR = TRAINING_DIR_NAME # Fallback to original to show error

EMBEDDINGS_FILE = os.getenv("EMBEDDINGS", "face_embeddings.npz")
MODEL_NAME = "buffalo_sc"  # InsightFace default model pack
CTX_ID = 0  # Default GPU ID, will be overwritten by dynamic detection

def get_insightface_app():
    """Lazy load InsightFace app"""
    try:
        import insightface
        from insightface.app import FaceAnalysis
        
        # Changes for : Dynamically detect and assign GPU device ID using gpu_utils : code updated by MD!!
        providers, ctx_id, gpu_name = gpu_utils.detect_gpu()
        if ctx_id == 0:
            logger.info(f"[GPU Detect] Found GPU: {gpu_name}")
        else:
            logger.info(f"[GPU Detect] {gpu_name}")
            
        app = FaceAnalysis(name=MODEL_NAME, providers=providers)
        app.prepare(ctx_id=ctx_id, det_size=(640, 640))
        return app
    except ImportError:
        logger.error("InsightFace not installed. Please run: pip install insightface onnxruntime")
        raise
    except Exception as e:
        logger.error(f"Failed to initialize InsightFace: {e}")
        raise

def process_image(app, img_path):
    """
    Process a single image to get the largest face embedding.
    """
    img = cv2.imread(img_path)
    if img is None:
        logger.warning(f"Could not read image: {img_path}")
        return None

    faces = app.get(img)
    if not faces:
        logger.warning(f"No face detected in {img_path}")
        return None
    
    # Sort by detection score or size creates better quality embeddings usually.
    # InsightFace result is usually sorted by size or score implicitly, but let's be sure.
    # We take the one with the highest detection score.
    best_face = max(faces, key=lambda x: x.det_score)
    
    return best_face.embedding

def train_model(training_dir, output_file):
    """
    Generate and save face embeddings from training images using InsightFace.
    """
    if not os.path.exists(training_dir):
        logger.error(f"Training directory not found: {training_dir}")
        return

    logger.info("Initializing InsightFace model...")
    app = get_insightface_app()
    
    known_names = []
    known_embeddings = []
    
    # Traverse training directory
    # Structure: training_dir/PersonName/image.jpg
    for person_name in os.listdir(training_dir):
        person_dir = os.path.join(training_dir, person_name)
        
        if not os.path.isdir(person_dir):
            continue
            
        logger.info(f"Processing {person_name}...")
        
        # We only need one good embedding per person, or we can average multiple.
        # To keep it simple and consistent with previous logic, we take the first valid one.
        # However, averaging embeddings from multiple images is better for accuracy.
        # Let's try to collect multiple and average them if possible, or just take best.
        # For this script, let's stick to "first valid" to match previous logic but upgrade to InsightFace.
        
        embedding_found = False
        
        # Collect all valid images for the person
        person_embeddings = []
        
        valid_extensions = ('.jpg', '.jpeg', '.png', '.bmp')
        for filename in os.listdir(person_dir):
            if filename.lower().endswith(valid_extensions):
                img_path = os.path.join(person_dir, filename)
                
                try:
                    emb = process_image(app, img_path)
                    if emb is not None:
                        person_embeddings.append(emb)
                except Exception as e:
                    logger.error(f"Error processing {img_path}: {e}")
        
        if person_embeddings:
            # Normalize each
            person_embeddings = [e / np.linalg.norm(e) for e in person_embeddings]
            
            # Average them for a robust representation
            avg_embedding = np.mean(person_embeddings, axis=0)
            avg_embedding = avg_embedding / np.linalg.norm(avg_embedding)
            
            known_names.append(person_name)
            known_embeddings.append(avg_embedding)
            logger.info(f"  -> Added {person_name} (from {len(person_embeddings)} images)")
        else:
            logger.warning(f"  -> No valid faces found for {person_name}")

    if not known_names:
        logger.error("No embeddings generated. Exiting.")
        return

    # Save to .npz
    # InsightFace embeddings are typically 512-dim
    try:
        np.savez(output_file, names=np.array(known_names), embeddings=np.array(known_embeddings))
        logger.info(f"Successfully saved {len(known_names)} embeddings to {output_file}")
    except Exception as e:
        logger.error(f"Failed to save embeddings file: {e}")

if __name__ == "__main__":
    train_model(TRAINING_DIR, EMBEDDINGS_FILE)

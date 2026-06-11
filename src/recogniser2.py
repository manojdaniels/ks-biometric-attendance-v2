# Changes for : Removed massive block of redundant commented-out legacy code to clean up the file : code updated by MD!!

# Changes for : Moved gpu_utils import to the top to inject NVIDIA DLLs before onnxruntime loads : code updated by MD!!
import gpu_utils # MUST BE FIRST
import cv2
import numpy as np
import os
import logging
from insightface.app import FaceAnalysis
from dotenv import load_dotenv

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)
load_dotenv()

model_name = "buffalo_sc"

def get_insightface_app():
    logger.info(f"Loading InsightFace model ({model_name})...")
    # Changes for : Dynamically detect and assign GPU device ID using gpu_utils : code updated by MD!!
    providers, ctx_id, gpu_name = gpu_utils.detect_gpu()
    if ctx_id == 0:
        logger.info(f"[GPU Detect] Found GPU: {gpu_name}")
    else:
        logger.info(f"[GPU Detect] {gpu_name}")
    
    app = FaceAnalysis(name=model_name, providers=providers)
    app.prepare(ctx_id=ctx_id, det_size=(640, 640))
    logger.info("InsightFace model loaded.")
    return app

def load_known_faces():
    embeddings_path = os.getenv("EMBEDDINGS")
    if not embeddings_path or not os.path.exists(embeddings_path):
        logger.error("Embeddings path not set or file not found.")
        return np.array([]), np.array([])

    try:
        data = np.load(embeddings_path)
        known_names = data['names']
        known_embeddings = data['embeddings']
        norms = np.linalg.norm(known_embeddings, axis=1)
        known_embeddings = known_embeddings / norms[:, np.newaxis]
        logger.info(f"Loaded {len(known_names)} embeddings.")
        return known_embeddings, known_names
    except Exception as e:
        logger.error(f"Failed to load embeddings: {e}")
        return np.array([]), np.array([])

def process_frames_with_draw(frame, app, k_embs, k_names, last_frame_gray=None):
    current_gray = cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY)

    # Motion check — agar koi movement nahi toh skip
    if last_frame_gray is not None:
        delta = cv2.absdiff(last_frame_gray, current_gray)
        thresh = cv2.threshold(delta, 25, 255, cv2.THRESH_BINARY)[1]
        if cv2.countNonZero(thresh) < 500:
            return frame, current_gray, None

    faces = app.get(frame)
    annotated_frame = frame.copy()
    best_match_name = None

    for face in faces:
        bbox = face.bbox.astype(int)
        if face.det_score < 0.5:
            continue

        embedding = face.embedding / np.linalg.norm(face.embedding)
        name = "Unknown"
        max_score = 0

        if len(k_embs) > 0:
            sims = np.dot(k_embs, embedding)
            max_idx = np.argmax(sims)
            max_score = sims[max_idx]
            # Threshold for ArcFace
            if max_score > 0.4:
                name = k_names[max_idx]
                if best_match_name is None:
                    best_match_name = name

        x1, y1, x2, y2 = bbox
        color = (0, 255, 0) if name != "Unknown" else (0, 0, 255)
        cv2.rectangle(annotated_frame, (x1, y1), (x2, y2), color, 2)
        cv2.putText(annotated_frame, f"{name} ({max_score:.2f})",
                    (x1, y1 - 10), cv2.FONT_HERSHEY_SIMPLEX, 0.5, color, 2)

    return annotated_frame, current_gray, best_match_name
# Changes for : Removed massive block of redundant commented-out legacy code to clean up the file : code updated by MD!!
import os
import cv2
import logging
import numpy as np
import time
import struct
import threading

from datetime import datetime
from multiprocessing import Process, Event, Queue, shared_memory

from dotenv import load_dotenv
from flask import Flask, Response

from camera_connect import connect_camera, kill_process_tree
from backend_api import send_attendance_to_backend

load_dotenv()

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(levelname)s - %(message)s"
)


FRAME_WIDTH = 640
FRAME_HEIGHT = 480
CHANNELS = 3
FRAME_SIZE = FRAME_WIDTH * FRAME_HEIGHT * CHANNELS
SHM_SIZE = FRAME_SIZE + 8


def start_camera_stream_server():
    app = Flask(__name__)
    streams = {
        "entry": "ann_entry_camera",
        "exit": "ann_exit_camera",
    }

    def stream_frames(shm_name):
        shm = None
        last_frame_id = -1

        try:
            shm = shared_memory.SharedMemory(name=shm_name)
            while True:
                frame_id = struct.unpack('Q', shm.buf[:8])[0]

                if frame_id != last_frame_id:
                    raw_frame = bytes(shm.buf[8:8 + FRAME_SIZE])
                    frame = np.frombuffer(raw_frame, dtype=np.uint8).reshape(
                        (FRAME_HEIGHT, FRAME_WIDTH, CHANNELS)
                    )

                    ok, encoded = cv2.imencode(".jpg", frame)
                    if ok:
                        last_frame_id = frame_id
                        yield (
                            b"--frame\r\n"
                            b"Content-Type: image/jpeg\r\n\r\n" +
                            encoded.tobytes() +
                            b"\r\n"
                        )

                time.sleep(0.08)

        except Exception as e:
            logging.error(f"MJPEG stream error for {shm_name}: {e}")
        finally:
            if shm:
                shm.close()

    @app.get("/health")
    def health():
        return {"status": "UP"}

    @app.get("/video/<camera>")
    def video(camera):
        shm_name = streams.get(camera)
        if not shm_name:
            return {"message": "Camera stream not found"}, 404

        return Response(
            stream_frames(shm_name),
            mimetype="multipart/x-mixed-replace; boundary=frame"
        )

    host = os.getenv("CAMERA_UI_HOST", "0.0.0.0")
    port = int(os.getenv("CAMERA_UI_PORT", "5055"))

    threading.Thread(
        target=lambda: app.run(host=host, port=port, threaded=True, use_reloader=False),
        daemon=True,
    ).start()

    logging.info(f"Camera UI streams available at http://localhost:{port}/video/entry and /video/exit")


def create_shared_memory(name):
    try:
        try:
            shm = shared_memory.SharedMemory(name=name, create=False)
            shm.close()
            shm.unlink()
        except FileNotFoundError:
            pass
        except Exception as e:
            logging.warning(f"Could not cleanup existing shared memory {name}: {e}")

        shm = shared_memory.SharedMemory(name=name, create=True, size=SHM_SIZE)
        return shm
    except Exception as e:
        logging.error(f"Failed to create shared memory {name}: {e}")
        return None


def camera_process_loop(name, shm_name, url, shutdown_event):
    shm = None
    try:
        shm = shared_memory.SharedMemory(name=shm_name)
        buffer = shm.buf
        frame_counter = 0

        if not url:
            logging.warning(f"[{name}] No URL set.")
            return

        ffmpeg_path = os.getenv("FFMPEG_PATH", "ffmpeg")

        while not shutdown_event.is_set():
            logging.info(f"[{name}] Connecting to {url}...")
            process = None
            try:
                process, w, h, size = connect_camera(ffmpeg_path, url)

                while not shutdown_event.is_set():
                    raw_frame = process.stdout.read(size)
                    if len(raw_frame) != size:
                        logging.warning(f"[{name}] Incomplete frame or stream ended.")
                        break

                    frame_counter += 1
                    buffer[:8] = struct.pack('Q', frame_counter)
                    buffer[8:8+size] = raw_frame

            except Exception as e:
                logging.error(f"[{name}] Connection error: {e}")
                time.sleep(2)
            finally:
                if process:
                    try:
                        kill_process_tree(process.pid)
                        process.stdout.close()
                        if process.stderr:
                            process.stderr.close()
                    except:
                        pass

            time.sleep(1)

    except Exception as e:
        logging.critical(f"[{name}] Critical process error: {e}")
    finally:
        if shm:
            shm.close()


def recognition_process_loop(names_list, shm_names, result_queue, shutdown_event):
    from recogniser2 import get_insightface_app, load_known_faces, process_frames_with_draw

    # Load ONCE — dono threads share karenge
    app = get_insightface_app()
    k_embs, k_names = load_known_faces()

    def camera_worker(name, shm_name):
        last_processed_id = 0
        last_gray = None

        try:
            shm = shared_memory.SharedMemory(name=shm_name)
            buf = shm.buf
        except FileNotFoundError:
            logging.error(f"SHM not found: {shm_name}")
            return

        while not shutdown_event.is_set():
            try:
                frame_id = struct.unpack('Q', buf[:8])[0]

                if frame_id > last_processed_id + 8:
                    raw_data = bytes(buf[8:8+FRAME_SIZE])
                    frame = np.frombuffer(raw_data, dtype=np.uint8).reshape(
                        (FRAME_HEIGHT, FRAME_WIDTH, CHANNELS)
                    )

                    annotated, gray, person_name = process_frames_with_draw(
                        frame, app, k_embs, k_names, last_gray
                    )

                    try:
                        ann_name = f"ann_{name.replace(' ', '_').lower()}"
                        ann_shm = shared_memory.SharedMemory(name=ann_name)
                        ann_shm.buf[:8] = struct.pack('Q', frame_id)
                        ann_shm.buf[8:8+FRAME_SIZE] = annotated.tobytes()
                        ann_shm.close()
                    except:
                        pass

                    last_gray = gray
                    last_processed_id = frame_id

                    if person_name:
                        result_queue.put({
                            "type": "detection",
                            "camera": name,
                            "name": person_name,
                            "timestamp": datetime.now()
                        })
                else:
                    time.sleep(0.01)

            except Exception as e:
                logging.error(f"[{name}] Recognition error: {e}")
                time.sleep(0.05)

        shm.close()

    threads = []
    for name in names_list:
        t = threading.Thread(
            target=camera_worker,
            args=(name, shm_names[name]),
            daemon=True
        )
        threads.append(t)
        t.start()
        logging.info(f"Recognition thread started: {name}")

    for t in threads:
        t.join()


def attendance_manager(result_queue, shutdown_event):
    """
    Receives recognition events and stores attendance in MongoDB.
    Prevents duplicate ENTRY/EXIT events using a cooldown.
    """

    last_entry = {}
    last_exit = {}

    COOLDOWN = int(os.getenv("ATTENDANCE_EVENT_COOLDOWN_SECONDS", "300"))

    while not shutdown_event.is_set():

        try:
            data = result_queue.get(timeout=1)

        except Exception:
            continue

        if data.get("type") != "detection":
            continue

        name = data["name"]
        camera = data["camera"]
        timestamp = data["timestamp"]

        # ---------------- EXIT ----------------

        if camera == "ENTRY CAMERA":

            if (
                name not in last_exit
                or (timestamp - last_exit[name]).total_seconds() > COOLDOWN
            ):

                logging.info(f"[{camera} -> EXIT] {name}")

                send_attendance_to_backend(
                    name=name,
                    event_type="exit",
                    timestamp=timestamp,
                )

                last_exit[name] = timestamp

        # ---------------- ENTRY ----------------

        elif camera == "EXIT CAMERA":

            if (
                name not in last_entry
                or (timestamp - last_entry[name]).total_seconds() > COOLDOWN
            ):

                logging.info(f"[{camera} -> ENTRY] {name}")

                send_attendance_to_backend(
                    name=name,
                    event_type="entry",
                    timestamp=timestamp,
                )

                last_entry[name] = timestamp

       # except Exception:
        #    pass


if __name__ == "__main__":
    from multiprocessing import freeze_support
    freeze_support()

    SHM_ENTRY = "shm_entry_cam"
    SHM_EXIT = "shm_exit_cam"

    shm_entry = create_shared_memory(SHM_ENTRY)
    shm_exit = create_shared_memory(SHM_EXIT)
    shm_ann_entry = create_shared_memory("ann_entry_camera")
    shm_ann_exit = create_shared_memory("ann_exit_camera")

    if not shm_entry or not shm_exit or not shm_ann_entry or not shm_ann_exit:
        logging.critical("Failed to allocate Shared Memory. Exiting.")
        exit(1)

    start_camera_stream_server()

    entry_url = os.getenv("ENTRY_CAMERA", "")
    exit_url = os.getenv("EXIT_CAMERA", "")
    logging.info(f"ENTRY CAMERA URL: {entry_url or 'NOT SET'}")
    logging.info(f"EXIT CAMERA URL:  {exit_url or 'NOT SET'}")

    try:
        shutdown_event = Event()
        result_queue = Queue()

        p_cam_entry = Process(target=camera_process_loop, args=("ENTRY CAMERA", SHM_ENTRY, entry_url, shutdown_event))
        p_cam_exit = Process(target=camera_process_loop, args=("EXIT CAMERA", SHM_EXIT, exit_url, shutdown_event))
        p_cam_entry.start()
        p_cam_exit.start()

        p_rec = Process(target=recognition_process_loop,
                        args=(["ENTRY CAMERA", "EXIT CAMERA"],
                              {"ENTRY CAMERA": SHM_ENTRY, "EXIT CAMERA": SHM_EXIT},
                              result_queue, shutdown_event))
        p_rec.start()

        t_attendance = threading.Thread(target=attendance_manager, args=(result_queue, shutdown_event))
        t_attendance.start()

        logging.info("System Started. Press 'q' to exit.")
        cv2.namedWindow("Monitor", cv2.WINDOW_NORMAL)

        while not shutdown_event.is_set():
            frame_entry = np.frombuffer(shm_ann_entry.buf[8:8+FRAME_SIZE], dtype=np.uint8).reshape((FRAME_HEIGHT, FRAME_WIDTH, CHANNELS)).copy()
            frame_exit = np.frombuffer(shm_ann_exit.buf[8:8+FRAME_SIZE], dtype=np.uint8).reshape((FRAME_HEIGHT, FRAME_WIDTH, CHANNELS)).copy()

            combined = np.hstack((frame_entry, frame_exit))
            cv2.imshow("Monitor", combined)

            if cv2.waitKey(30) & 0xFF == ord('q'):
                shutdown_event.set()
                break

            time.sleep(0.05)

    except Exception as e:
        logging.error(f"Main loop error: {e}")
    finally:
        logging.info("Shutting down...")
        shutdown_event.set()

        if 'p_cam_entry' in locals(): p_cam_entry.join()
        if 'p_cam_exit' in locals(): p_cam_exit.join()
        if 'p_rec' in locals(): p_rec.join()
        if 't_attendance' in locals(): t_attendance.join()

        for s in [shm_entry, shm_exit, shm_ann_entry, shm_ann_exit]:
            try:
                s.close()
                s.unlink()
            except:
                pass

        cv2.destroyAllWindows()

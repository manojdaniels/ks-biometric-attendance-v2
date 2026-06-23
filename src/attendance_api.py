import logging
import requests
from datetime import datetime

API_URL = "http://localhost:8001/api/attendance/entryExit"

logger = logging.getLogger(__name__)


def send_attendance(name, event_type, timestamp, camera=None, confidence=None):
    """
    Send attendance to Node.js backend.

    event_type : entry / exit
    """

    try:

        payload = {
            "name": name
        }

        if event_type == "entry":
            payload["entry"] = timestamp.isoformat()
        else:
            payload["exit"] = timestamp.isoformat()

        if camera:
            payload["camera"] = camera

        if confidence is not None:
            payload["confidence"] = float(confidence)

        r = requests.post(
            API_URL,
            params={"type": event_type},
            json=payload,
            timeout=5
        )

        if r.ok:
            logger.info(
                f"MongoDB Attendance Stored : {name} ({event_type})"
            )
        else:
            logger.error(
                f"Attendance API Error : {r.status_code} {r.text}"
            )

    except Exception as e:
        logger.exception(e)
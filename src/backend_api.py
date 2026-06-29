import logging
from datetime import datetime
from urllib import response
import requests
import os
from dotenv import load_dotenv

load_dotenv()

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s %(levelname)s %(message)s"
)

logger = logging.getLogger(__name__)


BACKEND_URL = os.getenv(
    "BACKEND_URL",
    "http://localhost:8000/api"
)


def send_attendance_to_backend(
    name,
    event_type,
    timestamp
):
    """
    Send ENTRY/EXIT attendance to Node backend.
    """

    try:

        if isinstance(timestamp, datetime):
            timestamp = timestamp.isoformat()

        url = f"{BACKEND_URL}/attendance/entryExit?type={event_type}"

        if event_type == "entry":

            payload = {
                "name": name,
                "entry": timestamp
            }

        else:

            payload = {
                "name": name,
                "exit": timestamp
            }

        response = requests.post(
            url,
            json=payload,
            timeout=5
        )

        print(
    f"[MongoDB] HTTP {response.status_code} -> {response.text}"
    )

        if response.ok:
            logger.info(
                f"{event_type.upper()} response for {name}: {response.text}"
            )
        else:
            logger.warning(
                f"Backend returned an error for {event_type.upper()} {name}: {response.text}"
            )

        return response

    except Exception as e:

        logger.error(
            f"[MongoDB] {e}"
        )

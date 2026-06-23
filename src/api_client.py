import os
import requests
import logging
from dotenv import load_dotenv

load_dotenv()

BASE_URL = os.getenv(
    "BACKEND_API",
    "http://localhost:8001/api"
)

TIMEOUT = 5


def send_attendance(name, event_type, timestamp):
    """
    event_type:
        entry
        exit
    """

    url = f"{BASE_URL}/attendance/entryExit?type={event_type}"

    body = {
        "name": name
    }

    if event_type == "entry":
        body["entry"] = timestamp.isoformat()

    else:
        body["exit"] = timestamp.isoformat()

    try:

        r = requests.post(
            url,
            json=body,
            timeout=TIMEOUT
        )

        if r.status_code == 200:

            logging.info(
                f"{event_type.upper()} stored for {name}"
            )

        else:

            logging.error(
                f"Backend error {r.status_code}: {r.text}"
            )

    except Exception as e:

        logging.error(f"Attendance API failed : {e}")
from datetime import datetime
from attendance_api import send_attendance

send_attendance(
    "Rahul",
    "entry",
    datetime.now()
)
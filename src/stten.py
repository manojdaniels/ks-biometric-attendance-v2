import pandas as pd
import os, requests, json, logging
from datetime import datetime
from dotenv import load_dotenv
from duration import calculate_duration

load_dotenv()
ENTRY_API_URL = os.getenv("ENTRY_URL")
EXIT_API_URL = os.getenv("EXIT_URL")
HEADERS = {'Content-Type': 'application/json'}

logging.basicConfig(level=logging.INFO,
                    format='%(asctime)s - %(levelname)s - %(message)s')

def initialize_attendance_file(path="attendance.csv"):
    columns = ['Employee_Name',   'Entry_Time',   'Exit_Time',   'Total_duration']
    try:
        if not os.path.exists(path):
            logging.info(f"Creating new attendance file at {os.path.abspath(path)}")
            pd.DataFrame(columns=columns).to_csv(path, index=False)
        return pd.read_csv(path)
    except Exception as e:
        logging.error(f"Error initializing attendance file: {e}")
        return pd.DataFrame(columns=columns)

def save_attendance(df, path):
    try:
        df.to_csv(path, index=False)
        logging.info("Attendance data saved successfully")
    except Exception as e:
        logging.error(f"Error saving attendance: {e}")

def mark_attendance(df, path, name, entry_time=None, exit_time=None):
    try:
        if entry_time:
            entry_str = entry_time.strftime("%Y-%m-%d %H:%M:%S")
            mask = (df['Employee_Name'] == name) & (df['Exit_Time'].isna())
            if df[mask].empty:
                new_entry = {
                    'Employee_Name': name,
                    'Entry_Time': entry_str,
                    'Exit_Time': pd.NA,
                    'Total_duration': pd.NA
                }
                df = pd.concat([df, pd.DataFrame([new_entry])], ignore_index=True)
                save_attendance(df, path)
                call_api(name, 'entry', entry_time)

        if exit_time:
            exit_str = exit_time.strftime("%Y-%m-%d %H:%M:%S")
            mask = (df['Employee_Name'] == name) & (df['Exit_Time'].isna())
            if not df[mask].empty:
                last_idx = df[mask].index[-1]
                entry_str = df.at[last_idx, 'Entry_Time']
                if pd.notna(entry_str):
                    entry_dt = datetime.strptime(entry_str, "%Y-%m-%d %H:%M:%S")
                    exit_dt = datetime.strptime(exit_str, "%Y-%m-%d %H:%M:%S")
                    if exit_time > entry_dt:
                        # Changes for : Streamlined redundant logic for saving attendance and calculating duration : code updated by MD!!
                        df.at[last_idx, 'Exit_Time'] = exit_str
                        df.at[last_idx, 'Total_duration'] = calculate_duration(entry_dt, exit_dt)
                        save_attendance(df, path)
                        
                        if exit_time.date() > entry_dt.date():
                            logging.warning(f"Exit date {exit_time.date()} is after entry date {entry_dt.date()} for {name}. Skipping API call.")
                        else:
                            print("Attendance successfully saved")
                            call_api(name, 'exit', exit_time)

            else:
          
                new_exit_entry = {
                    'Employee_Name': name,
                    'Entry_Time': "No entry available ",
                    'Exit_Time': exit_str,
                    'Total_duration':" no duration"
                }
                df = pd.concat([df, pd.DataFrame([new_exit_entry])], ignore_index=True)
                save_attendance(df, path)
                # call_api(name, 'exit', exit_time)
                logging.warning(f"Exit recorded without prior entry for {name}")

        return df
    except Exception as e:
        logging.error(f"Error marking attendance: {e}")
        return df

def call_api(name, action_type, timestamp):

    payload = {
        "name": name,
        action_type: timestamp.strftime("%Y-%m-%d %H:%M:%S")
    }
    url = ENTRY_API_URL if action_type == 'entry' else EXIT_API_URL
    try:
        response = requests.post(url, json=payload, headers=HEADERS)
        print(payload)
        print(response.json())
        response.raise_for_status()
        logging.info(f"{action_type.capitalize()} API success for {name}")
    except requests.exceptions.RequestException as e:
        logging.error(f"API {action_type} failed for {name}: {str(e)}")

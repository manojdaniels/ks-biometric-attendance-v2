**AI-Powered Auto-Attendance System**

An advanced AI attendance system using DeepFace for facial recognition and motion-triggered RTSP cameras to detect and log employee entry and exit. It integrates seamlessly with a Node.js backend and a React frontend, and uses a Python app to process and push attendance data in real-time.

**🚀 Features**

**Dual Camera Support**: Entry and Exit camera setup via RTSP.  
**Face Recognition**: Uses DeepFace with trained embeddings (min. 20 images/person).  
**Real-Time Logging**: Entry/Exit marked instantly and sent to backend.  
**Backend Sync**: Communicates with Node.js API to store data in a central DB.  
**Frontend Ready**: React app displays live attendance logs.   
**Embeddings-Based Matching**: Loads stored embeddings and compares live faces.  


**🛠 Requirements**  
Python 3.10.0    
deepface>=0.0.75  
opencv-python>=4.5.0  
ffmpeg  
requests  
Node.js backend (API)  
React frontend (UI)  
RTSP-compatible IP cameras  
MQTT Service

**For using MQTT**  
Install mosquitto  


**Run Following command**  
net start mosquitto  


**check with message sending**  
mosquitto_sub -h localhost -t test  
mosquitto_pub -h localhost -t test -m "Hello MQTT"(paste this on another terminal)  


**Face Recognition Details**    
Model: ArcFace (for high-accuracy facial recognition)  
Detector:centerFace 


**SETUP**  
git clone <repository-url>  
cd ai-attendance  


* 1. Create virtual environment  
python -m venv venv  

* 2. Activate it  
* On Windows  
venv\Scripts\activate  
* On macOS/Linux  
source venv/bin/activate  

* 3. Install dependencies  
pip install -r requirements.txt   


install watchdog (working as nodemon)


**Create .env file**  
EMBEDDINGS=your_embeddings_file(.npz format)  
ATTENDANCE_PATH= your_csv_file    
ENTRY_URL="backend_entry_url"  
EXIT_URL="backend_exit_url"  
FFMPEG_PATH="your_ffmpeg_path"  
TOPIC= 
MQTT_BROKER=  
MQTT_BROKER_USERNAME=  
MQTT_BROKER_PASSWORD=  
MQTT_PORT=  

**How It Works**  
Train the Model: Add at least 20 photos per person in a folder structure.  
Generate Embeddings: Pre-process and store face embeddings.  

**Train and Generate Embeddings:**  
cd src   
watchmedo auto-restart --patterns="*.py" --recursive -- python train_service.py   
watchmedo auto-restart --patterns="*.py" --recursive -- python model_service.py    

 



import os
import ffmpeg as ffm
import logging
import numpy as np
import signal
import subprocess
import sys

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

def connect_camera(ffmpeg_path, rtsp_url, timeout=10):
    """
    Connect to RTSP stream using FFmpeg with robust process handling.
    Returns: process (subprocess.Popen), width, height, frame_size
    """
    import urllib.parse
    
    # Fix for passwords containing '@' which break standard RTSP parsers
    if rtsp_url.startswith("rtsp://"):
        try:
            # Look for the last '@' which separates credentials from host
            parts = rtsp_url[7:].rsplit('@', 1)
            if len(parts) == 2:
                creds, host_path = parts
                if ':' in creds:
                    user, pwd = creds.split(':', 1)
                    # Encode user/pass and reconstruct
                    user_enc = urllib.parse.quote(user)
                    pwd_enc = urllib.parse.quote(pwd)
                    rtsp_url = f"rtsp://{user_enc}:{pwd_enc}@{host_path}"
        except:
            pass # Fallback to original
    # Ensure ffmpeg contains executable
    if not os.path.isfile(ffmpeg_path):
        # try adding .exe on windows if missing
        if sys.platform == 'win32' and not ffmpeg_path.endswith('.exe'):
             ffmpeg_path += '.exe'
        
        if not os.path.isfile(ffmpeg_path):
            raise FileNotFoundError(f"FFmpeg executable not found at {ffmpeg_path}")

    # Add directory to PATH just in case, though direct path usage is safer
    os.environ["PATH"] += os.pathsep + os.path.dirname(ffmpeg_path)

    # Path to ffprobe in same dir as ffmpeg
    # ffprobe_path = os.path.join(os.path.dirname(ffmpeg_path), "ffprobe.exe" if sys.platform == 'win32' else "ffprobe")

    # Reverting to hardcoded resolution as probing is failing/slow.
    # We will FORCE the output to be this size using the 's' flag in ffmpeg output.
    width = 640
    height = 480
    
    # try:
    #     # Probe the stream to get actual resolution
    #     # We must explicitly tell ffmpeg to use the correct ffprobe binary via cmd
    #     probe = ffm.probe(rtsp_url, cmd=ffprobe_path, stimeout='5000000', transport='tcp')
    #     video_stream = next((stream for stream in probe['streams'] if stream['codec_type'] == 'video'), None)
    #     if video_stream is None:
    #         raise Exception("No video stream found")
    #         
    #     width = int(video_stream['width'])
    #     height = int(video_stream['height'])
    #     logger.info(f"Camera {rtsp_url} resolution probed: {width}x{height}")
    # except Exception as e:
    #     logger.warning(f"Could not probe camera {rtsp_url}, falling back to 640x480: {e}")
    #     width = 640
    #     height = 480

    frame_size = width * height * 3

    try:
        # Use low-latency flags for RTSP
        process = (
            ffm
            .input(
                rtsp_url,
                rtsp_transport="tcp",
                timeout=str(timeout * 2000000),  # RTSP timeout in microseconds
                reorder_queue_size=100,
                buffer_size="2048000",
                max_delay="1000000"
            )
            # Force resize to our target width/height
            .output(
                'pipe:',
                format='rawvideo',
                pix_fmt='bgr24',
                s=f"{width}x{height}",  # This forces FFmpeg to resize the output!
                preset='ultrafast',
                tune='zerolatency',
                loglevel='error'  # Silent now to save CPU/Terminal overhead
            )
            .global_args('-hide_banner')
            .run_async(pipe_stdout=True, pipe_stderr=True, cmd=ffmpeg_path) 
            # run_async returns a subprocess.Popen object
        )
        
        logger.info(f"Connected to camera {rtsp_url} with PID {process.pid}")
        return process, width, height, frame_size

    except ffm.Error as e:
        logger.error(f"FFmpeg error: {e.stderr.decode() if e.stderr else str(e)}")
        raise
    except Exception as e:
        logger.error(f"Failed to connect to camera {rtsp_url}: {e}")
        raise

def kill_process_tree(pid):
    """
    Kills a process and its children.
    On Windows, this uses taskkill /F /T /PID.
    """
    try:
        if sys.platform == 'win32':
            subprocess.call(['taskkill', '/F', '/T', '/PID', str(pid)], 
                            stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
        else:
            os.killpg(os.getpgid(pid), signal.SIGKILL)
    except Exception as e:
        logger.error(f"Failed to kill process tree {pid}: {e}")
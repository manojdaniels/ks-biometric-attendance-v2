# Changes for : Created this utility file to handle dynamic GPU detection and NVIDIA DLL path injection : code updated by MD!!
import os
import subprocess
import logging

logger = logging.getLogger(__name__)

def _inject_nvidia_dlls():
    if os.name == 'nt':
        import site
        try:
            site_packages = site.getsitepackages()
            for sp in site_packages:
                nvidia_dir = os.path.join(sp, "nvidia")
                if not os.path.exists(nvidia_dir):
                    continue
                for pkg in os.listdir(nvidia_dir):
                    bin_path = os.path.join(nvidia_dir, pkg, "bin")
                    if os.path.exists(bin_path):
                        os.add_dll_directory(bin_path)
                        os.environ["PATH"] = bin_path + os.pathsep + os.environ["PATH"]
        except Exception as e:
            logger.debug(f"Failed to inject nvidia DLLs: {e}")

# Inject immediately upon import
_inject_nvidia_dlls()

def detect_gpu():
    """
    Detects if a GPU is available via ONNX Runtime and attempts to fetch its name.
    Returns:
        tuple: (providers_list, ctx_id, gpu_name_str)
    """
    gpu_name = "None"
    ctx_id = -1
    providers = ['CPUExecutionProvider']

    try:
        import onnxruntime as ort
        available_providers = ort.get_available_providers()
        
        if 'CUDAExecutionProvider' in available_providers:
            providers = ['CUDAExecutionProvider', 'CPUExecutionProvider']
            ctx_id = 0
            
            # Try to get GPU name using nvidia-smi
            try:
                result = subprocess.run(
                    ['nvidia-smi', '--query-gpu=name', '--format=csv,noheader'],
                    stdout=subprocess.PIPE,
                    stderr=subprocess.PIPE,
                    text=True,
                    check=True,
                    creationflags=subprocess.CREATE_NO_WINDOW if os.name == 'nt' else 0
                )
                output = result.stdout.strip()
                if output:
                    # In case of multiple GPUs, just take the first one for display
                    gpu_name = output.split('\n')[0].strip()
            except Exception as e:
                logger.warning(f"Could not fetch GPU name using nvidia-smi: {e}")
                gpu_name = "Unknown NVIDIA GPU"
        else:
            gpu_name = "No GPU detected (Falling back to CPU)"
            
    except ImportError:
        logger.error("onnxruntime is not installed.")
        gpu_name = "onnxruntime missing"
        
    return providers, ctx_id, gpu_name

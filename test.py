import onnxruntime as ort
 
print("ONNX Runtime Version:", ort.__version__)
print("Available Providers:", ort.get_available_providers())
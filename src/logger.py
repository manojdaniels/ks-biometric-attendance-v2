# logger_config.py - Create this file FIRST
import logging
import logging.handlers
import os
import psutil
import GPUtil
from datetime import datetime
import traceback
import sys

class SystemMonitor:
    """Real-time system resource monitor with alerts"""
    
    def __init__(self, log_dir='logs'):
        os.makedirs(log_dir, exist_ok=True)
        self.setup_logging(log_dir)
        self.alerts_sent = {}
        
    def setup_logging(self, log_dir):
        """Configure multi-level logging with rotation"""
        
        # Main application log
        self.app_logger = logging.getLogger('app')
        self.app_logger.setLevel(logging.DEBUG)
        
        # Performance metrics log
        self.perf_logger = logging.getLogger('performance')
        self.perf_logger.setLevel(logging.INFO)
        
        # Error log (separate file for critical issues)
        self.error_logger = logging.getLogger('errors')
        self.error_logger.setLevel(logging.ERROR)
        
        # Formatters
        detailed_formatter = logging.Formatter(
            '%(asctime)s | %(name)s | %(levelname)s | '
            'PID:%(process)d | %(funcName)s:%(lineno)d | %(message)s'
        )
        
        simple_formatter = logging.Formatter(
            '%(asctime)s | %(levelname)s | %(message)s'
        )
        
        # Rotating file handlers (prevent log files from filling disk)
        app_handler = logging.handlers.RotatingFileHandler(
            f'{log_dir}/app.log',
            maxBytes=50*1024*1024,  # 50MB
            backupCount=5
        )
        app_handler.setFormatter(detailed_formatter)
        self.app_logger.addHandler(app_handler)
        
        perf_handler = logging.handlers.RotatingFileHandler(
            f'{log_dir}/performance.log',
            maxBytes=20*1024*1024,  # 20MB
            backupCount=3
        )
        perf_handler.setFormatter(simple_formatter)
        self.perf_logger.addHandler(perf_handler)
        
        error_handler = logging.handlers.RotatingFileHandler(
            f'{log_dir}/errors.log',
            maxBytes=10*1024*1024,  # 10MB
            backupCount=10  # Keep more error logs
        )
        error_handler.setFormatter(detailed_formatter)
        self.error_logger.addHandler(error_handler)
        
        # Console handler (only warnings and above)
        console_handler = logging.StreamHandler(sys.stdout)
        console_handler.setLevel(logging.WARNING)
        console_handler.setFormatter(simple_formatter)
        self.app_logger.addHandler(console_handler)
        
    def log_system_stats(self):
        """Log current system resource usage"""
        try:
            # CPU and RAM
            process = psutil.Process()
            cpu_percent = process.cpu_percent(interval=0.1)
            memory_info = process.memory_info()
            memory_mb = memory_info.rss / 1024 / 1024
            
            # GPU stats
            gpu_stats = []
            try:
                gpus = GPUtil.getGPUs()
                for gpu in gpus:
                    gpu_stats.append({
                        'id': gpu.id,
                        'load': gpu.load * 100,
                        'memory_used': gpu.memoryUsed,
                        'memory_total': gpu.memoryTotal,
                        'temperature': gpu.temperature
                    })
            except:
                gpu_stats = [{'error': 'GPU monitoring failed'}]
            
            # System-wide stats
            system_cpu = psutil.cpu_percent(interval=0.1)
            system_memory = psutil.virtual_memory()
            
            stats = {
                'timestamp': datetime.now().isoformat(),
                'process': {
                    'cpu_percent': cpu_percent,
                    'memory_mb': memory_mb,
                    'threads': process.num_threads(),
                    'open_files': len(process.open_files())
                },
                'system': {
                    'cpu_percent': system_cpu,
                    'memory_percent': system_memory.percent,
                    'memory_available_gb': system_memory.available / 1024**3
                },
                'gpu': gpu_stats
            }
            
            self.perf_logger.info(f"STATS: {stats}")
            
            # Alert on high usage
            if memory_mb > 4000:  # 4GB threshold
                self.send_alert('HIGH_MEMORY', f'Process using {memory_mb:.0f}MB')
            
            if gpu_stats and gpu_stats[0].get('memory_used', 0) > 8000:  # 8GB
                self.send_alert('HIGH_GPU_MEMORY', f"GPU using {gpu_stats[0]['memory_used']}MB")
            
            return stats
            
        except Exception as e:
            self.error_logger.error(f"Failed to log stats: {e}\n{traceback.format_exc()}")
            return None
    
    def send_alert(self, alert_type, message):
        """Send alert (rate-limited to prevent spam)"""
        now = datetime.now()
        last_sent = self.alerts_sent.get(alert_type)
        
        # Only send alert if not sent in last 5 minutes
        if not last_sent or (now - last_sent).total_seconds() > 300:
            self.error_logger.warning(f"ALERT [{alert_type}]: {message}")
            self.alerts_sent[alert_type] = now
            # TODO: Add Slack/Email notification here
    
    def log_exception(self, exc_type, exc_value, exc_traceback):
        """Log unhandled exceptions"""
        if issubclass(exc_type, KeyboardInterrupt):
            sys.__excepthook__(exc_type, exc_value, exc_traceback)
            return
        
        self.error_logger.critical(
            "Unhandled exception",
            exc_info=(exc_type, exc_value, exc_traceback)
        )

# Initialize global monitor
monitor = SystemMonitor()

# Set global exception handler
sys.excepthook = monitor.log_exception

# Expose loggers
app_logger = monitor.app_logger
perf_logger = monitor.perf_logger
error_logger = monitor.error_logger
import psutil

class SystemMonitor:

    def cpu(self):

        return psutil.cpu_percent()

    def memory(self):

        return psutil.virtual_memory().percent
import psutil

class HealthAI:

    def status(self):

        return{

            "cpu":psutil.cpu_percent(),
            "memory":psutil.virtual_memory().percent

        }
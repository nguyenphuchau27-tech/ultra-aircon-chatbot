import os

class SelfHealing:

    def restart(self,service):

        os.system(f"docker restart {service}")

        return "restarted"
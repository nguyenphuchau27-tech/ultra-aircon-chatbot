class AIOrchestrator:

    def dispatch(self,request):

        if request["type"] == "repair":
            return "dispatch_technician"

        if request["type"] == "energy":
            return "optimize_energy"

        return "monitor"
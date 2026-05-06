from technician_ai.global_dispatch_ai import GlobalDispatchAI
from pricing_ai.demand_prediction import DemandPredictionAI

class GlobalAI:

    def __init__(self):

        self.dispatch = GlobalDispatchAI()
        self.demand = DemandPredictionAI()

    def run(self,data):

        demand=self.demand.predict(data["history"])

        tech=self.dispatch.select_technician(
            data["order"],
            data["technicians"]
        )

        return {

            "demand":demand,
            "technician":tech

        }
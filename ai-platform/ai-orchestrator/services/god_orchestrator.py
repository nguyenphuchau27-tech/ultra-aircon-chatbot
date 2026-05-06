from autonomous.autonomous_dispatch import AutonomousDispatch
from pricing_ai.self_learning_pricing import SelfLearningPricing
from technician_ai.route_ai import RouteAI

class GodAI:

    def __init__(self):

        self.dispatch=AutonomousDispatch()
        self.pricing=SelfLearningPricing()
        self.route=RouteAI()

    def run(self,data):

        tech=self.dispatch.choose(
            data["order"],
            data["technicians"]
        )

        price=self.pricing.price(
            data["base_price"],
            data["demand"],
            data["supply"]
        )

        return{

            "technician":tech,
            "price":price

        }
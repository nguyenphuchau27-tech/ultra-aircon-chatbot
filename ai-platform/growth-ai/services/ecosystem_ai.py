class EcosystemAI:

    def optimize(self,data):

        if data["orders"] > data["technicians"]:

            return "RECRUIT_TECHNICIANS"

        if data["orders"] < 50:

            return "RUN_PROMOTION"

        return "STABLE"
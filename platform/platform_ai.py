class PlatformAI:

    def optimize(self,data):

        demand=data["demand"]
        tech=data["technicians"]

        if demand>tech:
            return "increase price"

        if tech>demand:
            return "promo"

        return "stable"
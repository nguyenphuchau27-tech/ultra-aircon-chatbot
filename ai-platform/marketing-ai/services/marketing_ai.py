class MarketingAI:

    def campaign(self,city):

        if city["orders"] < 50:
            return "RUN PROMOTION"

        if city["orders"] > 500:
            return "INCREASE PRICE"

        return "NORMAL"
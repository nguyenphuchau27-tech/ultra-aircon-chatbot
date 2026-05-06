class CityExpansionAI:

    def evaluate(self,city):

        score = 0

        score += city["population"]/100000
        score += city["income"]/1000
        score += city["demand"]

        if score > 100:
            return "LAUNCH CITY"

        return "WAIT"
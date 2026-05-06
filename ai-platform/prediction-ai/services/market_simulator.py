import random

class MarketSimulator:

    def simulate_day(self,city):

        base = city.orders

        fluctuation = random.randint(-20,20)

        return base + fluctuation
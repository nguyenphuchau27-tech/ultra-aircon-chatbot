import random

class SelfLearningPricing:

    def price(self,base,demand,supply):

        surge = demand / max(supply,1)

        if surge > 2:
            return base * 1.8

        if surge > 1:
            return base * 1.3

        return base
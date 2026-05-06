class FraudAI:

    def detect(self,order):

        risk=0

        if order["price"]>5000000:
            risk+=30

        if order["distance"]>50:
            risk+=20

        if order["user_orders"]<1:
            risk+=40

        return risk
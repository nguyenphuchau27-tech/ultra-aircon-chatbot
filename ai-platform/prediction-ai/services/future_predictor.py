class FuturePredictor:

    def forecast(self,history):

        avg = sum(history)/len(history)

        return avg * 1.1
import random

class AutonomousDispatch:

    def choose(self,order,technicians):

        best=None
        best_score=-1

        for tech in technicians:

            score=0

            score+=tech["rating"]*10
            score+=tech["jobs"]*2

            if tech["distance"]<3:
                score+=50

            if tech["online"]:
                score+=20

            if score>best_score:

                best_score=score
                best=tech

        return best
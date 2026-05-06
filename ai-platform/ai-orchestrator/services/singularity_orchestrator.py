from singularity.self_learning_ai import SelfLearningAI
from growth.city_expansion_ai import CityExpansionAI
from growth.recruitment_ai import RecruitmentAI

class SingularityAI:

    def __init__(self):

        self.learn = SelfLearningAI()
        self.city = CityExpansionAI()
        self.hire = RecruitmentAI()

    def run(self,data):

        decision = self.learn.train(data["history"])

        return {
            "platform_decision": decision
        }
class RecruitmentAI:

    def hire(self,technician):

        score = 0

        score += technician["experience"] * 5
        score += technician["rating"] * 10

        if score > 80:
            return "APPROVED"

        return "REJECTED"
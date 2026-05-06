class SupportAI:

    def answer(self,question):

        if "price" in question:
            return "Service price depends on technician and demand."

        if "cancel" in question:
            return "You can cancel order before technician arrives."

        return "Our team will support you soon."
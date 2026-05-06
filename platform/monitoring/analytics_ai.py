def analyze(orders, technicians):

    efficiency = orders / technicians

    if efficiency > 20:
        return "HIGH_PRODUCTIVITY"

    return "NORMAL_PRODUCTIVITY"
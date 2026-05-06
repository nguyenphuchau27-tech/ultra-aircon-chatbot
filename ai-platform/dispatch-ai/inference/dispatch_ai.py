import math


def distance(lat1, lng1, lat2, lng2):

    return math.sqrt((lat1 - lat2) ** 2 + (lng1 - lng2) ** 2)


def select_best_technician(customer, technicians):

    best = None
    best_score = -999

    for tech in technicians:

        # tính khoảng cách
        d = distance(
            customer['lat'],
            customer['lng'],
            tech['lat'],
            tech['lng']
        )

        # AI scoring
        score = 0
        score += tech["rating"] * 2
        score += tech["jobs"] * 0.1
        score -= d * 0.5

        if score > best_score:
            best_score = score
            best = tech

    return best
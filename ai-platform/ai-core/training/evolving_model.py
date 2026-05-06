def evolve(performance):

    if performance < 0.7:
        return "retrain_model"

    return "model_stable"
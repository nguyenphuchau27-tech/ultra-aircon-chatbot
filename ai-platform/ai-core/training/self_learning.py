def learn(feedback):

    score = sum(feedback)/len(feedback)

    return {

        "model_update": True,
        "new_score": score

    }
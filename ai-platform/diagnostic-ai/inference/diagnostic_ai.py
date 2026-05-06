def diagnose(symptoms):

    if "not_cold" in symptoms:
        return "gas leak"

    if "noise" in symptoms:
        return "fan issue"

    return "general check required"
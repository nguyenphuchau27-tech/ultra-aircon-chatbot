def control_system(load,errors):

    if errors > 10:
        return "RESTART_SERVICES"

    if load > 0.9:
        return "SCALE_UP"

    return "NORMAL_OPERATION"
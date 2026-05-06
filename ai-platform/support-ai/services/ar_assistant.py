def guide(problem):

    problem = problem.lower()

    if "không lạnh" in problem:
        return [
            "Kiểm tra gas",
            "Kiểm tra block",
            "Kiểm tra tụ điện"
        ]

    return ["Kiểm tra tổng thể thiết bị"]
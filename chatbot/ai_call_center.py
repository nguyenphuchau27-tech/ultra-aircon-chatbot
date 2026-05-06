def respond(message):

    message = message.lower()

    if "sửa máy lạnh" in message:
        return "Chúng tôi sẽ kết nối thợ gần bạn."

    if "giá bao nhiêu" in message:
        return "Giá phụ thuộc vào loại dịch vụ."

    return "Xin vui lòng cung cấp thêm thông tin."
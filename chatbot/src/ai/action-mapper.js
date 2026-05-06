const backendApi = require('../backend-api');

async function executeAction(intentResult) {
  switch (intentResult.intent) {
    case 'empty_message':
      return 'Ultra Aircon đã nhận webhook, nhưng chưa có nội dung tin nhắn.';

    case 'create_order': {
      const order = await backendApi.createOrder({
        serviceType: intentResult.entities.serviceType,
        address: intentResult.entities.address,
      });

      return `Đã tạo đơn thành công. Mã đơn: ${order.id}. Trạng thái: ${order.status}.`;
    }

    case 'view_orders': {
      const orders = await backendApi.getMyOrders();
      const list = Array.isArray(orders) ? orders : [];

      if (list.length === 0) {
        return 'Hiện chưa có đơn nào.';
      }

      return list
        .slice(0, 5)
        .map((order) => `#${order.id} - ${order.serviceType} - ${order.status}`)
        .join('\n');
    }

    default:
      return 'Ultra Aircon đã nhận tin nhắn. Anh/chị có thể nhắn: "máy lạnh không lạnh", "đặt lịch sửa máy lạnh", hoặc "xem đơn của tôi".';
  }
}

module.exports = {
  executeAction,
};
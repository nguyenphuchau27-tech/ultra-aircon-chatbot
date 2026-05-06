import { Order } from '../../../database/entities/order.entity';

function sanitizeUser(user: any) {
  if (!user) return user;

  const { password, ...safeUser } = user;
  return safeUser;
}

export function toOrderResponse(order: Order) {
  if (!order) return order;

  return {
    ...order,
    customer: sanitizeUser((order as any).customer),
    technician: (order as any).technician
      ? {
          ...(order as any).technician,
        }
      : null,
  };
}

export function toOrderListResponse(orders: Order[]) {
  return orders.map(toOrderResponse);
}
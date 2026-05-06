import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { Order } from '../../database/entities/order.entity';
import { Technician } from '../../database/entities/technician.entity';
import { CacheService } from '../cache/cache.service';
import { QueryOptimizationService } from '../../common/query-optimization.service';
import { SocketGateway } from '../realtime/socket.gateway';

type OrderStatus = 'pending' | 'assigned' | 'in_progress' | 'completed' | 'cancelled';

@Injectable()
export class OrdersService {
  private readonly orderRepo: Repository<Order>;
  private readonly technicianRepo: Repository<Technician>;
  private readonly cacheService: CacheService;
  private readonly queryOptimization: QueryOptimizationService;
  private readonly socketGateway: SocketGateway;

  constructor(
    @InjectRepository(Order)
    orderRepo: Repository<Order>,
    @InjectRepository(Technician)
    technicianRepo: Repository<Technician>,
    cacheService: CacheService,
    queryOptimization: QueryOptimizationService,
    socketGateway: SocketGateway,
  ) {
    this.orderRepo = orderRepo;
    this.technicianRepo = technicianRepo;
    this.cacheService = cacheService;
    this.queryOptimization = queryOptimization;
    this.socketGateway = socketGateway;
  }

  async create(data: Partial<Order>): Promise<Order> {
    let status: OrderStatus = 'pending';

    if (data.technicianId) {
      const technician = await this.technicianRepo.findOne({
        where: { id: data.technicianId },
      });

      if (!technician) {
        throw new NotFoundException('Technician not found');
      }

      if (!technician.isAvailable) {
        throw new BadRequestException('Technician is not available');
      }

      status = 'assigned';

      await this.technicianRepo.update(technician.id, {
        isAvailable: false,
      });
    }

    const order = this.orderRepo.create({
      customerId: data.customerId,
      technicianId: data.technicianId ?? null,
      serviceType: data.serviceType,
      address: data.address,
      lat: data.lat ?? null,
      lng: data.lng ?? null,
      price: data.price ?? null,
      status,
    });

    const saved = await this.orderRepo.save(order);

    await this.invalidateOrderCaches(saved.id);

    const createdOrder = await this.findOne(saved.id);

    if (createdOrder.technicianId) {
      this.socketGateway.sendOrderToTech(createdOrder.technicianId, createdOrder);
    }

    return createdOrder;
  }

  async findAll(page: number = 1, limit: number = 10, status?: string): Promise<Order[]> {
    const cacheKey = this.queryOptimization.generateCacheKey('orders:all', {
      page,
      limit,
      status,
    });

    return this.queryOptimization.cachedQuery(cacheKey, async () => {
      return this.queryOptimization.executeWithMonitoring('findAllOrders', async () => {
        const queryBuilder = this.orderRepo
          .createQueryBuilder('order')
          .leftJoinAndSelect('order.customer', 'customer')
          .leftJoinAndSelect('order.technician', 'technician');

        if (status) {
          queryBuilder.where('order.status = :status', { status });
        }

        const orders = await this.queryOptimization
          .applyPagination(queryBuilder, page, limit)
          .orderBy('order.createdAt', 'DESC')
          .getMany();

        return this.sanitizeOrders(orders);
      });
    });
  }

  async findByCustomer(customerId: number, page: number = 1, limit: number = 10): Promise<Order[]> {
    const cacheKey = this.queryOptimization.generateCacheKey('orders:customer', {
      customerId,
      page,
      limit,
    });

    return this.queryOptimization.cachedQuery(cacheKey, async () => {
      return this.queryOptimization.executeWithMonitoring('findOrdersByCustomer', async () => {
        const queryBuilder = this.orderRepo
          .createQueryBuilder('order')
          .leftJoinAndSelect('order.customer', 'customer')
          .leftJoinAndSelect('order.technician', 'technician')
          .where('order.customerId = :customerId', { customerId });

        const orders = await this.queryOptimization
          .applyPagination(queryBuilder, page, limit)
          .orderBy('order.createdAt', 'DESC')
          .getMany();

        return this.sanitizeOrders(orders);
      });
    });
  }

  async findByTechnician(
    technicianId: number,
    page: number = 1,
    limit: number = 10,
  ): Promise<Order[]> {
    const cacheKey = this.queryOptimization.generateCacheKey('orders:technician', {
      technicianId,
      page,
      limit,
    });

    return this.queryOptimization.cachedQuery(cacheKey, async () => {
      return this.queryOptimization.executeWithMonitoring('findOrdersByTechnician', async () => {
        const queryBuilder = this.orderRepo
          .createQueryBuilder('order')
          .leftJoinAndSelect('order.customer', 'customer')
          .leftJoinAndSelect('order.technician', 'technician')
          .where('order.technicianId = :technicianId', { technicianId });

        const orders = await this.queryOptimization
          .applyPagination(queryBuilder, page, limit)
          .orderBy('order.createdAt', 'DESC')
          .getMany();

        return this.sanitizeOrders(orders);
      });
    });
  }

  async findOne(id: number): Promise<Order> {
    const cacheKey = `order:${id}`;

    return this.queryOptimization.cachedQuery(cacheKey, async () => {
      return this.queryOptimization.executeWithMonitoring('findOneOrder', async () => {
        const order = await this.orderRepo.findOne({
          where: { id },
          relations: ['customer', 'technician'],
        });

        if (!order) {
          throw new NotFoundException('Order not found');
        }

        return this.sanitizeOrder(order);
      });
    });
  }

  async updateStatus(id: number, nextStatus: OrderStatus): Promise<Order> {
    const order = await this.findOne(id);
    const currentStatus = order.status as OrderStatus;

    this.assertStatusTransition(currentStatus, nextStatus);

    await this.queryOptimization.executeWithMonitoring('updateOrderStatus', async () => {
      return this.orderRepo.update(id, { status: nextStatus });
    });

    if ((nextStatus === 'completed' || nextStatus === 'cancelled') && order.technicianId) {
      await this.technicianRepo.update(order.technicianId, {
        isAvailable: true,
      });
    }

    await this.invalidateOrderCaches(id);

    return this.findOne(id);
  }

  async assignTechnician(orderId: number, technicianId: number): Promise<Order> {
    const order = await this.findOne(orderId);

    if (order.status === 'completed' || order.status === 'cancelled') {
      throw new BadRequestException('Cannot assign technician to a finished order');
    }

    const technician = await this.technicianRepo.findOne({
      where: { id: technicianId },
    });

    if (!technician) {
      throw new NotFoundException('Technician not found');
    }

    if (!technician.isAvailable) {
      throw new BadRequestException('Technician is not available');
    }

    if (order.technicianId && order.technicianId !== technicianId) {
      await this.technicianRepo.update(order.technicianId, {
        isAvailable: true,
      });
    }

    await this.queryOptimization.executeWithMonitoring('assignTechnicianToOrder', async () => {
      await this.orderRepo.update(orderId, {
        technicianId,
        status: 'assigned',
      });

      await this.technicianRepo.update(technicianId, {
        isAvailable: false,
      });
    });

    await this.invalidateOrderCaches(orderId);

    const updatedOrder = await this.findOne(orderId);

    this.socketGateway.sendOrderToTech(technicianId, updatedOrder);

    return updatedOrder;
  }

  async getOrderStats(): Promise<{
    total: number;
    byStatus: Array<{ status: string; count: string }>;
    recent: number;
  }> {
    const cacheKey = 'orders:stats';

    return this.queryOptimization.cachedQuery(
      cacheKey,
      async () => {
        return this.queryOptimization.executeWithMonitoring('getOrderStats', async () => {
          const stats = await this.orderRepo
            .createQueryBuilder('order')
            .select('order.status', 'status')
            .addSelect('COUNT(*)', 'count')
            .groupBy('order.status')
            .getRawMany();

          const total = await this.orderRepo.count();

          const recent = await this.orderRepo
            .createQueryBuilder('order')
            .where('order.createdAt >= :since', {
              since: new Date(Date.now() - 24 * 60 * 60 * 1000),
            })
            .getCount();

          return {
            total,
            byStatus: stats,
            recent,
          };
        });
      },
      300,
    );
  }

  private sanitizeOrders(orders: Order[]): Order[] {
    return orders.map((order) => this.sanitizeOrder(order));
  }

  private sanitizeOrder(order: Order): Order {
    return this.removeSensitiveFields(order) as Order;
  }

  private removeSensitiveFields<T>(value: T): T {
    if (Array.isArray(value)) {
      return value.map((item) => this.removeSensitiveFields(item)) as T;
    }

    if (value instanceof Date) {
      return value;
    }

    if (value && typeof value === 'object') {
      const source = value as Record<string, unknown>;
      const sanitized: Record<string, unknown> = {};

      for (const [key, nestedValue] of Object.entries(source)) {
        if (key === 'password' || key === 'passwordHash' || key === 'refreshTokenHash') {
          continue;
        }

        sanitized[key] = this.removeSensitiveFields(nestedValue);
      }

      return sanitized as T;
    }

    return value;
  }

  private async invalidateOrderCaches(orderId: number): Promise<void> {
    await this.cacheService.del(`order:${orderId}`);
    await this.cacheService.delPattern('orders:*');
    await this.cacheService.delPattern('technician:*');
  }

  private assertStatusTransition(current: OrderStatus, next: OrderStatus): void {
    if (current === next) {
      return;
    }

    const allowedTransitions: Record<OrderStatus, OrderStatus[]> = {
      pending: ['assigned', 'cancelled'],
      assigned: ['in_progress', 'cancelled'],
      in_progress: ['completed', 'cancelled'],
      completed: [],
      cancelled: [],
    };

    if (!allowedTransitions[current].includes(next)) {
      throw new BadRequestException(`Invalid order status transition from ${current} to ${next}`);
    }
  }
}
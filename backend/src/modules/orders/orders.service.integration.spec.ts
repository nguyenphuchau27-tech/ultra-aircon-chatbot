import { Test, TestingModule } from '@nestjs/testing';
import { TypeOrmModule, getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { OrdersService } from './orders.service';
import { Order } from '../../database/entities/order.entity';
import { User } from '../../database/entities/user.entity';
import { Technician } from '../../database/entities/technician.entity';
import { CacheService } from '../cache/cache.service';
import { QueryOptimizationService } from '../../common/query-optimization.service';

describe('OrdersService (Integration)', () => {
  let moduleRef: TestingModule;
  let service: OrdersService;
  let cacheService: CacheService;
  let userRepo: Repository<User>;
  let techRepo: Repository<Technician>;

  beforeEach(async () => {
    moduleRef = await Test.createTestingModule({
      imports: [
        TypeOrmModule.forRoot({
          type: 'better-sqlite3',
          database: ':memory:',
          entities: [Order, User, Technician],
          synchronize: true,
          dropSchema: true,
          autoLoadEntities: false,
        }),
        TypeOrmModule.forFeature([Order, User, Technician]),
      ],
      providers: [OrdersService, CacheService, QueryOptimizationService],
    }).compile();

    service = moduleRef.get<OrdersService>(OrdersService);
    cacheService = moduleRef.get<CacheService>(CacheService);
    userRepo = moduleRef.get<Repository<User>>(getRepositoryToken(User));
    techRepo = moduleRef.get<Repository<Technician>>(getRepositoryToken(Technician));
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('Order CRUD Operations', () => {
    let testUser: User;
    let testTechnician: Technician;

    beforeEach(async () => {
      testUser = await userRepo.save({
        name: 'Test Customer',
        email: 'customer@test.com',
        phone: '+1234567890',
        password: 'hashedpassword',
        role: 'customer',
      } as Partial<User>);

      testTechnician = await techRepo.save({
        name: 'Test Technician',
        phone: '+0987654321',
        skill: 'aircon',
        latitude: 40.7128,
        longitude: -74.006,
        rating: 4.5,
        isAvailable: true,
      } as Partial<Technician>);
    });

    it('should create an order', async () => {
      const orderData = {
        customerId: testUser.id,
        serviceType: 'aircon_repair',
        address: '123 Test Street',
        lat: 40.7128,
        lng: -74.006,
        price: 150,
      };

      const order = await service.create(orderData as any);

      expect(order).toBeDefined();
      expect(order.customerId).toBe(testUser.id);
      expect(order.serviceType).toBe(orderData.serviceType);
      expect(order.status).toBe('pending');
    });

    it('should find all orders with relations', async () => {
      await service.create({
        customerId: testUser.id,
        serviceType: 'aircon_installation',
        address: '456 Order St',
        lat: 40.7128,
        lng: -74.006,
        price: 200,
      } as any);

      const orders = await service.findAll();

      expect(orders).toBeDefined();
      expect(Array.isArray(orders)).toBe(true);
      expect(orders.length).toBeGreaterThan(0);
      expect(orders[0]).toHaveProperty('customer');
      expect(orders[0]).toHaveProperty('technician');
    });

    it('should find orders by customer', async () => {
      await service.create({
        customerId: testUser.id,
        serviceType: 'maintenance',
        address: '789 Customer Ave',
        lat: 40.7128,
        lng: -74.006,
        price: 120,
      } as any);

      const customerOrders = await service.findByCustomer(testUser.id);

      expect(customerOrders).toBeDefined();
      expect(customerOrders.length).toBeGreaterThan(0);
      expect(customerOrders[0].customerId).toBe(testUser.id);
    });

    it('should find orders by technician', async () => {
      const order = await service.create({
        customerId: testUser.id,
        serviceType: 'repair',
        address: '321 Tech Blvd',
        lat: 40.7128,
        lng: -74.006,
        price: 180,
      } as any);

      await service.assignTechnician(order.id, testTechnician.id);

      const techOrders = await service.findByTechnician(testTechnician.id);

      expect(techOrders).toBeDefined();
      expect(techOrders.length).toBeGreaterThan(0);
      expect(techOrders[0].technicianId).toBe(testTechnician.id);
    });

    it('should find one order by id', async () => {
      const created = await service.create({
        customerId: testUser.id,
        serviceType: 'emergency',
        address: '999 Emergency Rd',
        lat: 40.7128,
        lng: -74.006,
        price: 300,
      } as any);

      const found = await service.findOne(created.id);

      expect(found).toBeDefined();
      expect(found.id).toBe(created.id);
      expect(found.customer).toBeDefined();
    });

    it('should throw error for non-existent order', async () => {
      await expect(service.findOne(999999)).rejects.toThrow('Order not found');
    });
  });

  describe('Order Status Management', () => {
    let testOrder: Order;

    beforeEach(async () => {
      const testUser = await userRepo.save({
        name: 'Status Test Customer',
        email: 'status@test.com',
        phone: '+1111111111',
        password: 'hashedpassword',
        role: 'customer',
      } as Partial<User>);

      testOrder = await service.create({
        customerId: testUser.id,
        serviceType: 'status_test',
        address: '123 Status St',
        lat: 40.7128,
        lng: -74.006,
        price: 100,
      } as any);
    });

    it('should update order status', async () => {
      const updated = await service.updateStatus(testOrder.id, 'confirmed');

      expect(updated.status).toBe('confirmed');
      expect(updated.id).toBe(testOrder.id);
    });

    it('should assign technician to order', async () => {
      const testTech = await techRepo.save({
        name: 'Assignment Tech',
        phone: '+2222222222',
        skill: 'aircon',
        latitude: 40.7128,
        longitude: -74.006,
        rating: 4.8,
        isAvailable: true,
      } as Partial<Technician>);

      const assigned = await service.assignTechnician(testOrder.id, testTech.id);

      expect(assigned.technicianId).toBe(testTech.id);
      expect(assigned.status).toBe('assigned');
    });
  });

  describe('Order Statistics', () => {
    beforeEach(async () => {
      const testUser = await userRepo.save({
        name: 'Stats Customer',
        email: 'stats@test.com',
        phone: '+3333333333',
        password: 'hashedpassword',
        role: 'customer',
      } as Partial<User>);

      await service.create({
        customerId: testUser.id,
        serviceType: 'stats_test_1',
        address: '111 Stats St',
        lat: 40.7128,
        lng: -74.006,
        price: 100,
      } as any);

      const order2 = await service.create({
        customerId: testUser.id,
        serviceType: 'stats_test_2',
        address: '222 Stats St',
        lat: 40.7128,
        lng: -74.006,
        price: 200,
      } as any);

      await service.updateStatus(order2.id, 'completed');
    });

    it('should get order statistics', async () => {
      const stats = await service.getOrderStats();

      expect(stats).toBeDefined();
      expect(stats).toHaveProperty('total');
      expect(stats).toHaveProperty('byStatus');
      expect(stats).toHaveProperty('recent');
      expect(stats.total).toBeGreaterThan(0);
      expect(Array.isArray((stats as any).byStatus)).toBe(true);
    });
  });

  describe('Pagination', () => {
    beforeEach(async () => {
      const testUser = await userRepo.save({
        name: 'Pagination Customer',
        email: 'pagination@test.com',
        phone: '+4444444444',
        password: 'hashedpassword',
        role: 'customer',
      } as Partial<User>);

      for (let i = 0; i < 5; i++) {
        await service.create({
          customerId: testUser.id,
          serviceType: `pagination_test_${i}`,
          address: `${i} Pagination St`,
          lat: 40.7128,
          lng: -74.006,
          price: 100 + i,
        } as any);
      }
    });

    it('should paginate results', async () => {
      const page1 = await service.findAll(1, 2);
      const page2 = await service.findAll(2, 2);

      expect(page1.length).toBe(2);
      expect(page2.length).toBe(2);

      const page1Ids = page1.map((o: any) => o.id);
      const page2Ids = page2.map((o: any) => o.id);

      expect(page1Ids).not.toEqual(page2Ids);
    });

    it('should filter by status', async () => {
      const allOrders = await service.findAll(1, 10);
      const pendingOrder = allOrders.find((o: any) => o.status === 'pending');

      if (pendingOrder) {
        await service.updateStatus(pendingOrder.id, 'completed');
      }

      const completedOrders = await service.findAll(1, 10, 'completed');

      expect(completedOrders.length).toBeGreaterThan(0);
      completedOrders.forEach((order: any) => {
        expect(order.status).toBe('completed');
      });
    });
  });

  describe('Caching Integration', () => {
    it('should cache order queries', async () => {
      const testUser = await userRepo.save({
        name: 'Cache Customer',
        email: 'cache@test.com',
        phone: '+5555555555',
        password: 'hashedpassword',
        role: 'customer',
      } as Partial<User>);

      const order = await service.create({
        customerId: testUser.id,
        serviceType: 'cache_test',
        address: '123 Cache St',
        lat: 40.7128,
        lng: -74.006,
        price: 140,
      } as any);

      await service.findOne(order.id);

      const cacheKey = `order:${order.id}`;
      const cached = await cacheService.get(cacheKey);

      expect(cached).toBeDefined();
    });

    it('should invalidate cache on updates', async () => {
      const testUser = await userRepo.save({
        name: 'Cache Invalidation Customer',
        email: 'cacheinv@test.com',
        phone: '+6666666666',
        password: 'hashedpassword',
        role: 'customer',
      } as Partial<User>);

      const order = await service.create({
        customerId: testUser.id,
        serviceType: 'cache_invalidation_test',
        address: '123 Invalidation St',
        lat: 40.7128,
        lng: -74.006,
        price: 160,
      } as any);

      await service.findOne(order.id);
      await service.updateStatus(order.id, 'confirmed');

      const cacheKey = `order:${order.id}`;
      const cached = await cacheService.get(cacheKey);

      expect(cached).toBeNull();
    });
  });
});




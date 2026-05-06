import { Repository } from 'typeorm';
import { Test, TestingModule } from '@nestjs/testing';
import { TypeOrmModule } from '@nestjs/typeorm';

import { User, UserRole } from '../database/entities/user.entity';
import { Technician } from '../database/entities/technician.entity';
import { Order } from '../database/entities/order.entity';
import { testDatabaseConfig } from './database.config';

export class TestUtils {
  static async setupTestDatabase(): Promise<void> {
    console.log('Setting up test database...');
  }

  static async teardownTestDatabase(): Promise<void> {
    console.log('Tearing down test database...');
  }

  static async createTestUser(overrides: Partial<User> = {}): Promise<User> {
    const defaultUser: Partial<User> = {
      name: 'Test User',
      email: `test${Date.now()}@example.com`,
      phone: `+1234567890${Math.floor(Math.random() * 1000)}`,
      password: 'hashedpassword',
      role: UserRole.CUSTOMER,
    };

    return { ...defaultUser, ...overrides } as User;
  }

  static async createTestTechnician(overrides: Partial<Technician> = {}): Promise<Technician> {
    const defaultTechnician: Partial<Technician> = {
      name: 'Test Technician',
      phone: `+1987654321${Math.floor(Math.random() * 1000)}`,
      skill: 'AC Repair',
      rating: 4.5,
      isAvailable: true,
      latitude: 10.762622,
      longitude: 106.660172,
    };

    return { ...defaultTechnician, ...overrides } as Technician;
  }

  static async createTestOrder(overrides: Partial<Order> = {}): Promise<Order> {
    const defaultOrder: Partial<Order> = {
      serviceType: 'AC Repair',
      status: 'pending',
      address: '123 Test Street, Test City',
      lat: 10.762622,
      lng: 106.660172,
      price: 150000,
    };

    return { ...defaultOrder, ...overrides } as Order;
  }

  static async createTestingModule(entities: any[] = []): Promise<TestingModule> {
    return Test.createTestingModule({
      imports: [
        TypeOrmModule.forRoot(testDatabaseConfig),
        TypeOrmModule.forFeature([User, Technician, Order, ...entities]),
      ],
    }).compile();
  }

  static async clearDatabaseTables(repositories: Repository<any>[]): Promise<void> {
    for (const repo of repositories) {
      await repo.clear();
    }
  }

  static async insertTestData(repositories: { [key: string]: Repository<any> }): Promise<{
    users: User[];
    technicians: Technician[];
    orders: Order[];
  }> {
    const users = [
      await repositories.user.save(await this.createTestUser({ role: UserRole.CUSTOMER })),
      await repositories.user.save(await this.createTestUser({ role: UserRole.TECHNICIAN })),
    ];

    const technicians = [
      await repositories.technician.save(
        await this.createTestTechnician({
          skill: 'AC Installation',
        }),
      ),
    ];

    const orders = [
      await repositories.order.save(
        await this.createTestOrder({
          customerId: users[0].id,
          technicianId: technicians[0].id,
        }),
      ),
    ];

    return { users, technicians, orders };
  }
}




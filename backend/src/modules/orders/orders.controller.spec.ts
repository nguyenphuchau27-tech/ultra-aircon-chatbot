import { ExecutionContext, INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';

import { OrdersController } from './orders.controller';
import { OrdersService } from './orders.service';
import { ScalabilityService } from '../../common/scalability.service';
import { JwtGuard } from '../../common/guards/jwt.guard';

class MockJwtGuard {
  canActivate(context: ExecutionContext): boolean {
    const req = context.switchToHttp().getRequest();
    req.user = {
      id: 1,
      role: 'customer',
      email: 'test@example.com',
    };
    return true;
  }
}

describe('OrdersController (e2e-lite)', () => {
  let app: INestApplication;

  const mockOrdersService = {
    findAll: jest.fn(),
    create: jest.fn(),
    findOne: jest.fn(),
    findByCustomer: jest.fn(),
    findByTechnician: jest.fn(),
    updateStatus: jest.fn(),
    assignTechnician: jest.fn(),
    getOrderStats: jest.fn(),
  };

  const mockScalabilityService = {
    incrementRequestCount: jest.fn(),
    decrementRequestCount: jest.fn(),
  };

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      controllers: [OrdersController],
      providers: [
        {
          provide: OrdersService,
          useValue: mockOrdersService,
        },
        {
          provide: ScalabilityService,
          useValue: mockScalabilityService,
        },
      ],
    })
      .overrideGuard(JwtGuard)
      .useValue(new MockJwtGuard())
      .compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  beforeEach(() => {
    jest.clearAllMocks();

    mockScalabilityService.incrementRequestCount.mockResolvedValue(true);
    mockScalabilityService.decrementRequestCount.mockResolvedValue(undefined);
  });

  afterAll(async () => {
    await app.close();
  });

  it('GET /orders', async () => {
    const result = [
      {
        id: 1,
        serviceType: 'repair',
        status: 'pending',
      },
    ];

    mockOrdersService.findAll.mockResolvedValue(result);

    await request(app.getHttpServer())
      .get('/orders')
      .set('Authorization', 'Bearer fake-token')
      .expect(200)
      .expect(result);

    expect(mockScalabilityService.incrementRequestCount).toHaveBeenCalled();
    expect(mockOrdersService.findAll).toHaveBeenCalledWith(1, 10, undefined);
    expect(mockScalabilityService.decrementRequestCount).toHaveBeenCalled();
  });

  it('POST /orders', async () => {
    const payload = {
      customerId: 1,
      serviceType: 'repair',
      address: '123 Test Street',
      lat: 10.77,
      lng: 106.69,
      price: 150,
    };

    const created = {
      id: 1,
      ...payload,
      status: 'pending',
    };

    mockOrdersService.create.mockResolvedValue(created);

    await request(app.getHttpServer())
      .post('/orders')
      .set('Authorization', 'Bearer fake-token')
      .send(payload)
      .expect(201)
      .expect(created);

    expect(mockScalabilityService.incrementRequestCount).toHaveBeenCalled();
    expect(mockOrdersService.create).toHaveBeenCalledWith(payload);
    expect(mockScalabilityService.decrementRequestCount).toHaveBeenCalled();
  });

  it('GET /orders/:id', async () => {
    const order = {
      id: 1,
      serviceType: 'repair',
      status: 'pending',
    };

    mockOrdersService.findOne.mockResolvedValue(order);

    await request(app.getHttpServer())
      .get('/orders/1')
      .set('Authorization', 'Bearer fake-token')
      .expect(200)
      .expect(order);

    expect(mockScalabilityService.incrementRequestCount).toHaveBeenCalled();
    expect(mockOrdersService.findOne).toHaveBeenCalledWith(1);
    expect(mockScalabilityService.decrementRequestCount).toHaveBeenCalled();
  });

  it('PUT /orders/:id/status', async () => {
    const updated = {
      id: 1,
      status: 'confirmed',
    };

    mockOrdersService.updateStatus.mockResolvedValue(updated);

    await request(app.getHttpServer())
      .put('/orders/1/status')
      .set('Authorization', 'Bearer fake-token')
      .send({ status: 'confirmed' })
      .expect(200)
      .expect(updated);

    expect(mockScalabilityService.incrementRequestCount).toHaveBeenCalled();
    expect(mockOrdersService.updateStatus).toHaveBeenCalledWith(1, 'confirmed');
    expect(mockScalabilityService.decrementRequestCount).toHaveBeenCalled();
  });

  it('PUT /orders/:id/assign/:technicianId', async () => {
    const updated = {
      id: 1,
      technicianId: 2,
      status: 'assigned',
    };

    mockOrdersService.assignTechnician.mockResolvedValue(updated);

    await request(app.getHttpServer())
      .put('/orders/1/assign/2')
      .set('Authorization', 'Bearer fake-token')
      .expect(200)
      .expect(updated);

    expect(mockScalabilityService.incrementRequestCount).toHaveBeenCalled();
    expect(mockOrdersService.assignTechnician).toHaveBeenCalledWith(1, 2);
    expect(mockScalabilityService.decrementRequestCount).toHaveBeenCalled();
  });

  it('GET /orders/stats', async () => {
    const stats = {
      total: 10,
      byStatus: [
        { status: 'pending', count: 6 },
        { status: 'completed', count: 4 },
      ],
      recent: 3,
    };

    mockOrdersService.getOrderStats.mockResolvedValue(stats);

    await request(app.getHttpServer())
      .get('/orders/stats')
      .set('Authorization', 'Bearer fake-token')
      .expect(200)
      .expect(stats);

    expect(mockScalabilityService.incrementRequestCount).toHaveBeenCalled();
    expect(mockOrdersService.getOrderStats).toHaveBeenCalled();
    expect(mockScalabilityService.decrementRequestCount).toHaveBeenCalled();
  });

  it('GET /orders/customer/:customerId', async () => {
    const result = [
      {
        id: 1,
        customerId: 1,
        status: 'pending',
      },
    ];

    mockOrdersService.findByCustomer.mockResolvedValue(result);

    await request(app.getHttpServer())
      .get('/orders/customer/1')
      .set('Authorization', 'Bearer fake-token')
      .expect(200)
      .expect(result);

    expect(mockOrdersService.findByCustomer).toHaveBeenCalledWith(1, 1, 10);
  });

  it('GET /orders/technician/:technicianId', async () => {
    const result = [
      {
        id: 1,
        technicianId: 2,
        status: 'assigned',
      },
    ];

    mockOrdersService.findByTechnician.mockResolvedValue(result);

    await request(app.getHttpServer())
      .get('/orders/technician/2')
      .set('Authorization', 'Bearer fake-token')
      .expect(200)
      .expect(result);

    expect(mockOrdersService.findByTechnician).toHaveBeenCalledWith(2, 1, 10);
  });
});
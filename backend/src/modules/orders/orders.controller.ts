import {
  BadRequestException,
  Body,
  Controller,
  ForbiddenException,
  Get,
  Param,
  ParseIntPipe,
  Post,
  Put,
  Query,
  UseGuards,
} from '@nestjs/common';

import { OrdersService } from './orders.service';
import { JwtGuard } from '../../common/guards/jwt.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import type { AuthenticatedUser } from '../../common/decorators/current-user.decorator';
import { CreateOrderDto } from './dto/create-order.dto';
import { UpdateOrderStatusDto } from './dto/update-order-status.dto';
import { ScalabilityService } from '../../common/scalability.service';
import { UserRole } from '../../database/entities/user.entity';
import { TechniciansService } from '../technicians/technicians.service';

@Controller('orders')
@UseGuards(JwtGuard)
export class OrdersController {
  private readonly ordersService: OrdersService;
  private readonly scalabilityService: ScalabilityService;
  private readonly techniciansService: TechniciansService;

  constructor(
    ordersService: OrdersService,
    scalabilityService: ScalabilityService,
    techniciansService: TechniciansService,
  ) {
    this.ordersService = ordersService;
    this.scalabilityService = scalabilityService;
    this.techniciansService = techniciansService;
  }

  @Post()
  async create(@Body() body: CreateOrderDto, @CurrentUser() user?: AuthenticatedUser) {
    if (!user) {
      throw new ForbiddenException('User not found in request');
    }

    if (user.role === UserRole.CUSTOMER) {
      if (body.customerId && body.customerId !== user.userId) {
        throw new ForbiddenException('You can only create your own order');
      }

      body.customerId = user.userId;
    } else if (user.role === UserRole.ADMIN) {
      if (!body.customerId) {
        throw new BadRequestException('customerId is required when admin creates an order');
      }
    } else {
      throw new ForbiddenException('Only customer or admin can create an order');
    }

    const canHandle = await this.scalabilityService.incrementRequestCount();
    if (!canHandle) {
      throw new Error('Service temporarily unavailable - high load');
    }

    try {
      return await this.ordersService.create(body);
    } finally {
      await this.scalabilityService.decrementRequestCount();
    }
  }

  @Get()
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  async getAll(
    @Query('page') page: string = '1',
    @Query('limit') limit: string = '10',
    @Query('status') status?: string,
  ) {
    const canHandle = await this.scalabilityService.incrementRequestCount();
    if (!canHandle) {
      throw new Error('Service temporarily unavailable - high load');
    }

    try {
      const pageNum = parseInt(page, 10) || 1;
      const limitNum = Math.min(parseInt(limit, 10) || 10, 100);

      return this.ordersService.findAll(pageNum, limitNum, status);
    } finally {
      await this.scalabilityService.decrementRequestCount();
    }
  }

  @Get('customer/:customerId')
  async getByCustomer(
    @Param('customerId', ParseIntPipe) customerId: number,
    @Query('page') page: string = '1',
    @Query('limit') limit: string = '10',
    @CurrentUser() user?: AuthenticatedUser,
  ) {
    if (!user) {
      throw new ForbiddenException('User not found in request');
    }

    if (user.role !== UserRole.ADMIN && user.userId !== customerId) {
      throw new ForbiddenException('You can only view your own orders');
    }

    const canHandle = await this.scalabilityService.incrementRequestCount();
    if (!canHandle) {
      throw new Error('Service temporarily unavailable - high load');
    }

    try {
      const pageNum = parseInt(page, 10) || 1;
      const limitNum = Math.min(parseInt(limit, 10) || 10, 50);

      return this.ordersService.findByCustomer(customerId, pageNum, limitNum);
    } finally {
      await this.scalabilityService.decrementRequestCount();
    }
  }

  @Get('technician/:technicianId')
  async getByTechnician(
    @Param('technicianId', ParseIntPipe) technicianId: number,
    @Query('page') page: string = '1',
    @Query('limit') limit: string = '10',
    @CurrentUser() user?: AuthenticatedUser,
  ) {
    if (!user) {
      throw new ForbiddenException('User not found in request');
    }

    if (user.role !== UserRole.ADMIN) {
      if (user.role !== UserRole.TECHNICIAN) {
        throw new ForbiddenException('Only admin or technician can view technician jobs');
      }

      const technician = await this.techniciansService.findOne(technicianId);

      if (technician.userId !== user.userId) {
        throw new ForbiddenException('You can only view your own technician jobs');
      }
    }

    const canHandle = await this.scalabilityService.incrementRequestCount();
    if (!canHandle) {
      throw new Error('Service temporarily unavailable - high load');
    }

    try {
      const pageNum = parseInt(page, 10) || 1;
      const limitNum = Math.min(parseInt(limit, 10) || 10, 50);

      return this.ordersService.findByTechnician(technicianId, pageNum, limitNum);
    } finally {
      await this.scalabilityService.decrementRequestCount();
    }
  }

  @Get('stats')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  async getStats() {
    const canHandle = await this.scalabilityService.incrementRequestCount();
    if (!canHandle) {
      throw new Error('Service temporarily unavailable - high load');
    }

    try {
      return this.ordersService.getOrderStats();
    } finally {
      await this.scalabilityService.decrementRequestCount();
    }
  }

  @Get(':id')
  async getOne(@Param('id', ParseIntPipe) id: number, @CurrentUser() user?: AuthenticatedUser) {
    if (!user) {
      throw new ForbiddenException('User not found in request');
    }

    const canHandle = await this.scalabilityService.incrementRequestCount();
    if (!canHandle) {
      throw new Error('Service temporarily unavailable - high load');
    }

    try {
      const order = await this.ordersService.findOne(id);

      if (user.role === UserRole.ADMIN) {
        return order;
      }

      if (user.role === UserRole.CUSTOMER && order.customerId === user.userId) {
        return order;
      }

      if (
        user.role === UserRole.TECHNICIAN &&
        order.technician &&
        order.technician.userId === user.userId
      ) {
        return order;
      }

      throw new ForbiddenException('You do not have access to this order');
    } finally {
      await this.scalabilityService.decrementRequestCount();
    }
  }

  @Put(':id/status')
  async updateStatus(
    @Param('id', ParseIntPipe) id: number,
    @Body() body: UpdateOrderStatusDto,
    @CurrentUser() user?: AuthenticatedUser,
  ) {
    if (!user) {
      throw new ForbiddenException('User not found in request');
    }

    const canHandle = await this.scalabilityService.incrementRequestCount();
    if (!canHandle) {
      throw new Error('Service temporarily unavailable - high load');
    }

    try {
      const order = await this.ordersService.findOne(id);

      if (user.role === UserRole.ADMIN) {
        return this.ordersService.updateStatus(id, body.status as any);
      }

      if (
        user.role === UserRole.CUSTOMER &&
        order.customerId === user.userId &&
        body.status === 'cancelled' &&
        (order.status === 'pending' || order.status === 'assigned')
      ) {
        return this.ordersService.updateStatus(id, body.status as any);
      }

      if (
        user.role === UserRole.TECHNICIAN &&
        order.technician &&
        order.technician.userId === user.userId &&
        (body.status === 'in_progress' || body.status === 'completed')
      ) {
        return this.ordersService.updateStatus(id, body.status as any);
      }

      throw new ForbiddenException('You do not have permission to update this order');
    } finally {
      await this.scalabilityService.decrementRequestCount();
    }
  }

  @Put(':id/assign/:technicianId')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  async assignTechnician(
    @Param('id', ParseIntPipe) orderId: number,
    @Param('technicianId', ParseIntPipe) technicianId: number,
  ) {
    const canHandle = await this.scalabilityService.incrementRequestCount();
    if (!canHandle) {
      throw new Error('Service temporarily unavailable - high load');
    }

    try {
      return this.ordersService.assignTechnician(orderId, technicianId);
    } finally {
      await this.scalabilityService.decrementRequestCount();
    }
  }
}

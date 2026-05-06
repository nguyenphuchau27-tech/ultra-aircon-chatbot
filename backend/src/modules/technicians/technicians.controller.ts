import {
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

import { TechniciansService } from './technicians.service';
import { JwtGuard } from '../../common/guards/jwt.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import type { AuthenticatedUser } from '../../common/decorators/current-user.decorator';
import { UpdateLocationDto } from './dto/update-location.dto';
import { ScalabilityService } from '../../common/scalability.service';
import { UserRole } from '../../database/entities/user.entity';

@Controller('technicians')
@UseGuards(JwtGuard)
export class TechniciansController {
  private readonly techService: TechniciansService;
  private readonly scalabilityService: ScalabilityService;

  constructor(techService: TechniciansService, scalabilityService: ScalabilityService) {
    this.techService = techService;
    this.scalabilityService = scalabilityService;
  }

  @Post()
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  async create(@Body() body: any) {
    const canHandle = await this.scalabilityService.incrementRequestCount();
    if (!canHandle) {
      throw new Error('Service temporarily unavailable - high load');
    }

    try {
      return await this.techService.create(body);
    } finally {
      await this.scalabilityService.decrementRequestCount();
    }
  }

  @Get()
  async getAll(
    @Query('page') page: string = '1',
    @Query('limit') limit: string = '10',
    @Query('skill') skill?: string,
  ) {
    const canHandle = await this.scalabilityService.incrementRequestCount();
    if (!canHandle) {
      throw new Error('Service temporarily unavailable - high load');
    }

    try {
      const pageNum = parseInt(page, 10) || 1;
      const limitNum = Math.min(parseInt(limit, 10) || 10, 100);

      if (skill) {
        return this.techService.findBySkill(skill, pageNum, limitNum);
      }

      return this.techService.findAll(pageNum, limitNum);
    } finally {
      await this.scalabilityService.decrementRequestCount();
    }
  }

  @Get('available')
  async getAvailable(
    @Query('lat') lat?: string,
    @Query('lng') lng?: string,
    @Query('radius') radius: string = '10',
  ) {
    const canHandle = await this.scalabilityService.incrementRequestCount();
    if (!canHandle) {
      throw new Error('Service temporarily unavailable - high load');
    }

    try {
      const latNum = lat !== undefined ? parseFloat(lat) : undefined;
      const lngNum = lng !== undefined ? parseFloat(lng) : undefined;
      const radiusNum = parseFloat(radius) || 10;

      return this.techService.findAvailable(latNum, lngNum, radiusNum);
    } finally {
      await this.scalabilityService.decrementRequestCount();
    }
  }

  @Get('nearby')
  async getNearby(
    @Query('lat') lat: string,
    @Query('lng') lng: string,
    @Query('radius') radius: string = '5',
    @Query('limit') limit: string = '10',
  ) {
    const canHandle = await this.scalabilityService.incrementRequestCount();
    if (!canHandle) {
      throw new Error('Service temporarily unavailable - high load');
    }

    try {
      const latNum = parseFloat(lat);
      const lngNum = parseFloat(lng);
      const radiusNum = parseFloat(radius) || 5;
      const limitNum = Math.min(parseInt(limit, 10) || 10, 50);

      return this.techService.getNearbyTechnicians(latNum, lngNum, radiusNum, limitNum);
    } finally {
      await this.scalabilityService.decrementRequestCount();
    }
  }

  @Get('locations')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  async getLocations() {
    const canHandle = await this.scalabilityService.incrementRequestCount();
    if (!canHandle) {
      throw new Error('Service temporarily unavailable - high load');
    }

    try {
      return this.techService.findAllLocations();
    } finally {
      await this.scalabilityService.decrementRequestCount();
    }
  }

  @Get(':id')
  async getOne(@Param('id', ParseIntPipe) id: number) {
    const canHandle = await this.scalabilityService.incrementRequestCount();
    if (!canHandle) {
      throw new Error('Service temporarily unavailable - high load');
    }

    try {
      return this.techService.findOne(id);
    } finally {
      await this.scalabilityService.decrementRequestCount();
    }
  }

  @Put('location/:id')
  async updateLocation(
    @Param('id', ParseIntPipe) id: number,
    @Body() body: UpdateLocationDto,
    @CurrentUser() user?: AuthenticatedUser,
  ) {
    if (!user) {
      throw new ForbiddenException('User not found in request');
    }

    if (user.role !== UserRole.ADMIN) {
      if (user.role !== UserRole.TECHNICIAN) {
        throw new ForbiddenException('Only admin or technician can update location');
      }

      const technician = await this.techService.findOne(id);

      if (technician.userId !== user.userId) {
        throw new ForbiddenException('You can only update your own location');
      }
    }

    const canHandle = await this.scalabilityService.incrementRequestCount();
    if (!canHandle) {
      throw new Error('Service temporarily unavailable - high load');
    }

    try {
      return this.techService.updateLocation(id, body.latitude, body.longitude);
    } finally {
      await this.scalabilityService.decrementRequestCount();
    }
  }
}

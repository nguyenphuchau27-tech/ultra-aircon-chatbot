import {
  Body,
  Controller,
  ForbiddenException,
  Get,
  Post,
  UseGuards,
} from '@nestjs/common';

import { TrackingService } from './tracking.service';
import { JwtGuard } from '../../common/guards/jwt.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import type { AuthenticatedUser } from '../../common/decorators/current-user.decorator';
import { UpdateTrackingDto } from './dto/update-tracking.dto';
import { UserRole } from '../../database/entities/user.entity';

@Controller('tracking')
@UseGuards(JwtGuard)
export class TrackingController {
  private readonly trackingService: TrackingService;

  constructor(trackingService: TrackingService) {
    this.trackingService = trackingService;
  }

  @Post('update')
  async updateLocation(
    @Body() body: UpdateTrackingDto,
    @CurrentUser() user?: AuthenticatedUser,
  ) {
    if (!user) {
      throw new ForbiddenException('User not found in request');
    }

    if (user.role !== UserRole.ADMIN && user.userId !== body.techId) {
      throw new ForbiddenException('You can only update your own tracking location');
    }

    await this.trackingService.updateLocation(body.techId, body.latitude, body.longitude);

    return { success: true };
  }

  @Get()
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  async getAll() {
    return this.trackingService.getAllLocations();
  }
}
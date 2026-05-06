import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Put,
  Delete,
  ParseIntPipe,
  UseGuards,
} from '@nestjs/common';

import { UsersService } from './users.service';
import { JwtGuard } from '../../common/guards/jwt.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { RolesGuard } from '../../common/guards/roles.guard';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { UserRole } from '../../database/entities/user.entity'; // ✅ FIX

@Controller('users')
@UseGuards(JwtGuard, RolesGuard)
export class UsersController {
  constructor(private readonly usersService: UsersService) {} // ✅ clean DI

  @Post()
  @Roles(UserRole.ADMIN) // ✅ FIX
  async createUser(@Body() body: CreateUserDto) {
    return this.usersService.create(body);
  }

  @Get()
  @Roles(UserRole.ADMIN) // ✅ FIX
  async getUsers() {
    return this.usersService.findAll();
  }

  @Get(':id')
  @Roles(UserRole.ADMIN) // ✅ FIX
  async getUser(@Param('id', ParseIntPipe) id: number) {
    return this.usersService.findById(id);
  }

  @Put(':id')
  @Roles(UserRole.ADMIN) // ✅ FIX
  async updateUser(
    @Param('id', ParseIntPipe) id: number,
    @Body() body: UpdateUserDto,
  ) {
    return this.usersService.update(id, body);
  }

  @Delete(':id')
  @Roles(UserRole.ADMIN) // ✅ FIX
  async deleteUser(@Param('id', ParseIntPipe) id: number) {
    return this.usersService.delete(id);
  }
}




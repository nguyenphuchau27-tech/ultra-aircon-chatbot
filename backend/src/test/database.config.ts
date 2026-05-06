// backend/src/test/database.config.ts
import { TypeOrmModuleOptions } from '@nestjs/typeorm';

import { User } from '../database/entities/user.entity';
import { Technician } from '../database/entities/technician.entity';
import { Order } from '../database/entities/order.entity';

export const testDatabaseConfig: TypeOrmModuleOptions = {
  type: 'better-sqlite3',
  database: ':memory:',
  entities: [User, Technician, Order],
  synchronize: true,
  dropSchema: true,
  autoLoadEntities: false,
  logging: false,
};




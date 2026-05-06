import 'reflect-metadata';
import { DataSource } from 'typeorm';

export const AppDataSource = new DataSource({
  type: 'postgres',

  host: process.env.DB_HOST || 'localhost',
  port: Number(process.env.DB_PORT) || 5432,

  username: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASS || 'password',
  database: process.env.DB_NAME || 'aircon_startup',

  entities: ['src/database/entities/*.entity.ts'],

  migrations: ['src/database/migrations/*.ts'],

  synchronize: false,
});

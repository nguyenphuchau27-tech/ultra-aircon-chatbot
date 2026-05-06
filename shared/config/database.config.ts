import { TypeOrmModuleOptions } from '@nestjs/typeorm';

export const databaseConfig: TypeOrmModuleOptions = {
  type: 'postgres',

  replication: {
    master: {
      host: process.env.DB_MASTER || 'db-master',
      port: 5432,
      username: process.env.DB_USER || 'postgres',
      password: process.env.DB_PASS || 'password',
      database: process.env.DB_NAME || 'aircon_startup',
    },

    slaves: [
      {
        host: process.env.DB_REPLICA1 || 'db-replica1',
        port: 5432,
        username: process.env.DB_USER || 'postgres',
        password: process.env.DB_PASS || 'password',
        database: process.env.DB_NAME || 'aircon_startup',
      },

      {
        host: process.env.DB_REPLICA2 || 'db-replica2',
        port: 5432,
        username: process.env.DB_USER || 'postgres',
        password: process.env.DB_PASS || 'password',
        database: process.env.DB_NAME || 'aircon_startup',
      },
    ],
  },

  autoLoadEntities: true,

  synchronize: false,

  logging: true,

  extra: {
    max: 20,
  },
};

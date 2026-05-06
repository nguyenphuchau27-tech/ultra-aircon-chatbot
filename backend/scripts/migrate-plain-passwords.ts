import 'reflect-metadata';
import * as dotenv from 'dotenv';
import { DataSource } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { User } from '../src/database/entities/user.entity';

dotenv.config();

function looksLikeBcryptHash(value: string): boolean {
  return /^\$2[aby]\$\d{2}\$/.test(value);
}

async function run() {
  const dataSource = new DataSource({
    type: 'postgres',
    host: process.env.DB_HOST,
    port: Number(process.env.DB_PORT || 5432),
    username: process.env.DB_USER,
    password: process.env.DB_PASS,
    database: process.env.DB_NAME,
    entities: [User],
  });

  await dataSource.initialize();

  try {
    const userRepo = dataSource.getRepository(User);
    const users = await userRepo.find();

    let migratedCount = 0;

    for (const user of users) {
      const currentPassword = (user as any).password as string | undefined;

      if (!currentPassword) {
        continue;
      }

      if (looksLikeBcryptHash(currentPassword)) {
        continue;
      }

      const hashedPassword = await bcrypt.hash(currentPassword, 12);
      (user as any).password = hashedPassword;
      await userRepo.save(user);

      migratedCount += 1;
      console.log(`Migrated password for user #${(user as any).id}`);
    }

    console.log(`Done. Migrated ${migratedCount} user(s).`);
  } finally {
    await dataSource.destroy();
  }
}

run().catch(error => {
  console.error('Password migration failed:', error);
  process.exit(1);
});
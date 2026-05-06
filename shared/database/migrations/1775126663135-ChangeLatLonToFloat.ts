import { MigrationInterface, QueryRunner } from 'typeorm';

export class ChangeLatLonToFloat1775126663135 implements MigrationInterface {
  name = 'ChangeLatLonToFloat1775126663135';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "technician" DROP COLUMN "latitude"`);
    await queryRunner.query(`ALTER TABLE "technician" ADD "latitude" double precision NOT NULL`);
    await queryRunner.query(`ALTER TABLE "technician" DROP COLUMN "longitude"`);
    await queryRunner.query(`ALTER TABLE "technician" ADD "longitude" double precision NOT NULL`);
    await queryRunner.query(`ALTER TABLE "technician" ALTER COLUMN "rating" SET DEFAULT '5'`);
    await queryRunner.query(`ALTER TABLE "technician" ALTER COLUMN "isAvailable" SET DEFAULT true`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "technician" ALTER COLUMN "isAvailable" DROP DEFAULT`);
    await queryRunner.query(`ALTER TABLE "technician" ALTER COLUMN "rating" DROP DEFAULT`);
    await queryRunner.query(`ALTER TABLE "technician" DROP COLUMN "longitude"`);
    await queryRunner.query(`ALTER TABLE "technician" ADD "longitude" integer NOT NULL`);
    await queryRunner.query(`ALTER TABLE "technician" DROP COLUMN "latitude"`);
    await queryRunner.query(`ALTER TABLE "technician" ADD "latitude" integer NOT NULL`);
  }
}

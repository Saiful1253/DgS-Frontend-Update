import { MigrationInterface, QueryRunner } from 'typeorm';

export class DropServiceDisplayOrder1792100000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "services" DROP COLUMN IF EXISTS "display_order"`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "services" ADD COLUMN IF NOT EXISTS "display_order" integer NOT NULL DEFAULT 0`,
    );
  }
}

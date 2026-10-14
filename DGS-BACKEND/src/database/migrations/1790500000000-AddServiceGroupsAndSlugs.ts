import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddServiceGroupsAndSlugs1790500000000 implements MigrationInterface {
  name = 'AddServiceGroupsAndSlugs1790500000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "service_groups" (
        "id" SERIAL PRIMARY KEY,
        "pillar" VARCHAR(100) NOT NULL,
        "name" VARCHAR(255) NOT NULL,
        "slug" VARCHAR(255) NOT NULL UNIQUE,
        "display_order" INT NOT NULL DEFAULT 0,
        "is_deleted" BOOLEAN NOT NULL DEFAULT false,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP NOT NULL DEFAULT now()
      )
    `);

    await queryRunner.query(`
      ALTER TABLE "services" 
      ADD COLUMN IF NOT EXISTS "group_id" INT NULL,
      ADD COLUMN IF NOT EXISTS "slug" VARCHAR(255) NULL
    `);

    // Backfill slug for existing services where slug is NULL
    await queryRunner.query(`
      UPDATE "services"
      SET "slug" = LOWER(REGEXP_REPLACE(name, '[^a-zA-Z0-9]+', '-', 'g'))
      WHERE "slug" IS NULL OR "slug" = ''
    `);

    await queryRunner.query(`
      ALTER TABLE "services"
      DROP CONSTRAINT IF EXISTS "FK_services_group_id"
    `);

    await queryRunner.query(`
      ALTER TABLE "services"
      ADD CONSTRAINT "FK_services_group_id"
      FOREIGN KEY ("group_id") REFERENCES "service_groups"("id")
      ON DELETE SET NULL ON UPDATE CASCADE
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "idx_services_pillar_order" 
      ON "services" ("pillar", "display_order") 
      WHERE is_deleted = false
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "idx_services_group_id" 
      ON "services" ("group_id")
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX IF EXISTS "idx_services_group_id"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "idx_services_pillar_order"`);
    await queryRunner.query(`ALTER TABLE "services" DROP CONSTRAINT IF EXISTS "FK_services_group_id"`);
    await queryRunner.query(`ALTER TABLE "services" DROP COLUMN IF EXISTS "slug"`);
    await queryRunner.query(`ALTER TABLE "services" DROP COLUMN IF EXISTS "group_id"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "service_groups"`);
  }
}

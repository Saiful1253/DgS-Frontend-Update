import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateServicePillarsTable1790600000000 implements MigrationInterface {
  name = 'CreateServicePillarsTable1790600000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "service_pillars" (
        "id" SERIAL PRIMARY KEY,
        "name" VARCHAR(100) NOT NULL,
        "slug" VARCHAR(120) NOT NULL UNIQUE,
        "display_label" VARCHAR(150) NOT NULL,
        "blurb" TEXT NULL,
        "icon" VARCHAR(500) NULL,
        "display_order" INT NOT NULL DEFAULT 0,
        "is_active" BOOLEAN NOT NULL DEFAULT true,
        "is_deleted" BOOLEAN NOT NULL DEFAULT false,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP NOT NULL DEFAULT now()
      )
    `);

    // Insert 3 default canonical pillars
    await queryRunner.query(`
      INSERT INTO "service_pillars" ("name", "slug", "display_label", "blurb", "display_order", "is_active")
      VALUES 
        ('Software Development', 'software-development', 'Software & Cloud', 'Engineering, AI, and cloud infrastructure for scalable operations.', 1, true),
        ('Creative Services', 'creative-services', 'Creative & Post-Production', 'Retouching, motion, 3D, and brand systems for commercial output.', 2, true),
        ('Digital Marketing', 'digital-marketing', 'Marketing & Growth', 'Paid acquisition, search positioning, and content architecture.', 3, true)
      ON CONFLICT ("slug") DO NOTHING;
    `);

    await queryRunner.query(`
      ALTER TABLE "service_groups" ADD COLUMN IF NOT EXISTS "pillar_id" INT NULL
    `);

    await queryRunner.query(`
      ALTER TABLE "services" ADD COLUMN IF NOT EXISTS "pillar_id" INT NULL
    `);

    // Backfill pillar_id for service_groups
    await queryRunner.query(`
      UPDATE "service_groups" sg
      SET "pillar_id" = sp.id
      FROM "service_pillars" sp
      WHERE sg.pillar = sp.name AND sg.pillar_id IS NULL
    `);

    // Backfill pillar_id for services
    await queryRunner.query(`
      UPDATE "services" s
      SET "pillar_id" = sp.id
      FROM "service_pillars" sp
      WHERE s.pillar = sp.name AND s.pillar_id IS NULL
    `);

    await queryRunner.query(`
      ALTER TABLE "service_groups"
      DROP CONSTRAINT IF EXISTS "FK_service_groups_pillar_id"
    `);

    await queryRunner.query(`
      ALTER TABLE "service_groups"
      ADD CONSTRAINT "FK_service_groups_pillar_id"
      FOREIGN KEY ("pillar_id") REFERENCES "service_pillars"("id")
      ON DELETE SET NULL ON UPDATE CASCADE
    `);

    await queryRunner.query(`
      ALTER TABLE "services"
      DROP CONSTRAINT IF EXISTS "FK_services_pillar_id"
    `);

    await queryRunner.query(`
      ALTER TABLE "services"
      ADD CONSTRAINT "FK_services_pillar_id"
      FOREIGN KEY ("pillar_id") REFERENCES "service_pillars"("id")
      ON DELETE SET NULL ON UPDATE CASCADE
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "services" DROP CONSTRAINT IF EXISTS "FK_services_pillar_id"`);
    await queryRunner.query(`ALTER TABLE "service_groups" DROP CONSTRAINT IF EXISTS "FK_service_groups_pillar_id"`);
    await queryRunner.query(`ALTER TABLE "services" DROP COLUMN IF EXISTS "pillar_id"`);
    await queryRunner.query(`ALTER TABLE "service_groups" DROP COLUMN IF EXISTS "pillar_id"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "service_pillars"`);
  }
}

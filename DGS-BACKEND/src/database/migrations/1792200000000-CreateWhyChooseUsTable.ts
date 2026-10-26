import { MigrationInterface, QueryRunner } from "typeorm";

export class CreateWhyChooseUsTable1792200000000 implements MigrationInterface {
  name = 'CreateWhyChooseUsTable1792200000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "why_choose_us" (
        "id" SERIAL NOT NULL,
        "title" character varying(255) NOT NULL,
        "description" text NOT NULL,
        "icon_url" character varying(500),
        "display_order" integer NOT NULL DEFAULT 0,
        "is_active" boolean NOT NULL DEFAULT false,
        "is_deleted" boolean NOT NULL DEFAULT false,
        "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        CONSTRAINT "PK_why_choose_us_id" PRIMARY KEY ("id")
      )
    `);

    // Add initial seed data from user screenshot (top 3 active, 4th inactive)
    await queryRunner.query(`
      INSERT INTO "why_choose_us" ("title", "description", "icon_url", "display_order", "is_active", "is_deleted")
      VALUES
        ('100% Safety Guarantee', 'Strict adherence to global safety codes, high-pressure nitrogen testing, and integrated automatic emergency isolation sensors.', NULL, 0, true, false),
        ('Titas Gas 1st Class Enlisted', 'Officially enlisted 1st Class Contractor for Titas Gas Transmission & Distribution Co. Ltd., backed by seamless regulatory processing.', NULL, 1, true, false),
        ('Expert Engineering Team', 'Led by professional mechanical engineers and ASME/API certified pipeline welders with decades of technical field leadership.', NULL, 2, true, false),
        ('24/7 Emergency Response', 'Dedicated mobile units equipped with calibrated gas sniffer detectors and repair tooling ready to deploy 24/7 across Dhaka.', NULL, 3, false, false)
      ON CONFLICT DO NOTHING
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS "why_choose_us"`);
  }
}

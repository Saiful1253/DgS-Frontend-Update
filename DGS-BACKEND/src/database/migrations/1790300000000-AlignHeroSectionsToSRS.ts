import { MigrationInterface, QueryRunner } from "typeorm";

export class AlignHeroSectionsToSRS1790300000000 implements MigrationInterface {
    name = 'AlignHeroSectionsToSRS1790300000000'

    public async up(queryRunner: QueryRunner): Promise<void> {
        // SRS field renames
        await queryRunner.query(`ALTER TABLE "hero_sections" RENAME COLUMN "title" TO "headline"`);
        await queryRunner.query(`ALTER TABLE "hero_sections" RENAME COLUMN "subtitle" TO "sub_headline"`);
        await queryRunner.query(`ALTER TABLE "hero_sections" RENAME COLUMN "cta_text" TO "primary_cta_label"`);
        await queryRunner.query(`ALTER TABLE "hero_sections" RENAME COLUMN "cta_link" TO "primary_cta_link"`);

        // Status (Active/Draft) replaces is_active boolean — backfill first
        await queryRunner.query(`ALTER TABLE "hero_sections" ADD "status" varchar(20) NOT NULL DEFAULT 'draft'`);
        await queryRunner.query(`UPDATE "hero_sections" SET "status" = 'active' WHERE "is_active" = true`);
        await queryRunner.query(`ALTER TABLE "hero_sections" DROP COLUMN "is_active"`);

        // Homepage-only hero — drop per-page keying
        await queryRunner.query(`DROP INDEX IF EXISTS "IDX_hero_sections_page_key"`);
        await queryRunner.query(`ALTER TABLE "hero_sections" DROP COLUMN IF EXISTS "page_key"`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "hero_sections" ADD "page_key" varchar(50) NOT NULL DEFAULT 'home'`);
        await queryRunner.query(`CREATE INDEX "IDX_hero_sections_page_key" ON "hero_sections" ("page_key")`);

        await queryRunner.query(`ALTER TABLE "hero_sections" ADD "is_active" boolean NOT NULL DEFAULT false`);
        await queryRunner.query(`UPDATE "hero_sections" SET "is_active" = true WHERE "status" = 'active'`);
        await queryRunner.query(`ALTER TABLE "hero_sections" DROP COLUMN "status"`);

        await queryRunner.query(`ALTER TABLE "hero_sections" RENAME COLUMN "primary_cta_link" TO "cta_link"`);
        await queryRunner.query(`ALTER TABLE "hero_sections" RENAME COLUMN "primary_cta_label" TO "cta_text"`);
        await queryRunner.query(`ALTER TABLE "hero_sections" RENAME COLUMN "sub_headline" TO "subtitle"`);
        await queryRunner.query(`ALTER TABLE "hero_sections" RENAME COLUMN "headline" TO "title"`);
    }

}
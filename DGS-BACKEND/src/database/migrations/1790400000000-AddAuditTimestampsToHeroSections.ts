import { MigrationInterface, QueryRunner } from "typeorm";

export class AddAuditTimestampsToHeroSections1790400000000 implements MigrationInterface {
    name = 'AddAuditTimestampsToHeroSections1790400000000'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "hero_sections" ADD COLUMN IF NOT EXISTS "created_at" TIMESTAMP NOT NULL DEFAULT now()`);
        await queryRunner.query(`ALTER TABLE "hero_sections" ADD COLUMN IF NOT EXISTS "updated_at" TIMESTAMP NOT NULL DEFAULT now()`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "hero_sections" DROP COLUMN "updated_at"`);
        await queryRunner.query(`ALTER TABLE "hero_sections" DROP COLUMN "created_at"`);
    }
}
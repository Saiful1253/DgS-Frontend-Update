import { MigrationInterface, QueryRunner } from "typeorm";

export class AddMissingColumnsToCompanySettingsAndPortfolios1792901000000 implements MigrationInterface {
  name = 'AddMissingColumnsToCompanySettingsAndPortfolios1792901000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // 1. Company settings columns
    await queryRunner.query(`ALTER TABLE "company_settings" ADD COLUMN IF NOT EXISTS "company_logo" character varying(500)`);
    await queryRunner.query(`ALTER TABLE "company_settings" ADD COLUMN IF NOT EXISTS "company_logo_public_id" character varying(255)`);
    await queryRunner.query(`ALTER TABLE "company_settings" ADD COLUMN IF NOT EXISTS "footer_text" text`);
    await queryRunner.query(`ALTER TABLE "company_settings" ADD COLUMN IF NOT EXISTS "copyright_year" character varying(10)`);
    await queryRunner.query(`ALTER TABLE "company_settings" ADD COLUMN IF NOT EXISTS "site_meta_title" character varying(255)`);
    await queryRunner.query(`ALTER TABLE "company_settings" ADD COLUMN IF NOT EXISTS "site_meta_description" text`);
    await queryRunner.query(`ALTER TABLE "company_settings" ADD COLUMN IF NOT EXISTS "site_meta_keywords" text`);
    await queryRunner.query(`ALTER TABLE "company_settings" ADD COLUMN IF NOT EXISTS "site_og_image" character varying(500)`);
    await queryRunner.query(`ALTER TABLE "company_settings" ADD COLUMN IF NOT EXISTS "canonical_url" character varying(500)`);
    await queryRunner.query(`ALTER TABLE "company_settings" ADD COLUMN IF NOT EXISTS "terms_and_conditions" text`);
    await queryRunner.query(`ALTER TABLE "company_settings" ADD COLUMN IF NOT EXISTS "privacy_policy" text`);
    await queryRunner.query(`ALTER TABLE "company_settings" ADD COLUMN IF NOT EXISTS "whatsapp_popup" character varying(10)`);
    await queryRunner.query(`ALTER TABLE "company_settings" ADD COLUMN IF NOT EXISTS "emi_enabled" character varying(10)`);
    await queryRunner.query(`ALTER TABLE "company_settings" ADD COLUMN IF NOT EXISTS "emi_interest_rate" character varying(20)`);
    await queryRunner.query(`ALTER TABLE "company_settings" ADD COLUMN IF NOT EXISTS "emi_min_amount" character varying(20)`);
    await queryRunner.query(`ALTER TABLE "company_settings" ADD COLUMN IF NOT EXISTS "emi_tenures" character varying(100)`);
    await queryRunner.query(`ALTER TABLE "company_settings" ADD COLUMN IF NOT EXISTS "emi_tenure_rates" text`);
    await queryRunner.query(`ALTER TABLE "company_settings" ADD COLUMN IF NOT EXISTS "hide_advanced_routes" character varying(10)`);
    await queryRunner.query(`ALTER TABLE "company_settings" ADD COLUMN IF NOT EXISTS "company_latitude" numeric(10,7)`);
    await queryRunner.query(`ALTER TABLE "company_settings" ADD COLUMN IF NOT EXISTS "company_longitude" numeric(10,7)`);

    // 2. Portfolios enums and columns
    await queryRunner.query(`
      DO $$
      BEGIN
          IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'portfolios_media_type_enum') THEN
              CREATE TYPE "portfolios_media_type_enum" AS ENUM ('image', 'youtube');
          END IF;
          IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'portfolios_project_status_enum') THEN
              CREATE TYPE "portfolios_project_status_enum" AS ENUM ('completed', 'ongoing');
          END IF;
          IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'portfolios_project_type_enum') THEN
              CREATE TYPE "portfolios_project_type_enum" AS ENUM ('residential', 'industrial', 'commercial_restaurant');
          END IF;
      END$$;
    `);

    await queryRunner.query(`ALTER TABLE "portfolios" ADD COLUMN IF NOT EXISTS "media_type" "portfolios_media_type_enum" NOT NULL DEFAULT 'image'`);
    await queryRunner.query(`ALTER TABLE "portfolios" ADD COLUMN IF NOT EXISTS "media_url" character varying(500)`);
    await queryRunner.query(`ALTER TABLE "portfolios" ADD COLUMN IF NOT EXISTS "project_status" "portfolios_project_status_enum" NOT NULL DEFAULT 'completed'`);
    await queryRunner.query(`ALTER TABLE "portfolios" ADD COLUMN IF NOT EXISTS "project_type" "portfolios_project_type_enum" NOT NULL DEFAULT 'residential'`);
    await queryRunner.query(`ALTER TABLE "portfolios" ADD COLUMN IF NOT EXISTS "address" text`);
    await queryRunner.query(`ALTER TABLE "portfolios" ADD COLUMN IF NOT EXISTS "latitude" numeric(10,7)`);
    await queryRunner.query(`ALTER TABLE "portfolios" ADD COLUMN IF NOT EXISTS "longitude" numeric(10,7)`);
    await queryRunner.query(`ALTER TABLE "portfolios" ADD COLUMN IF NOT EXISTS "description" text`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "portfolios" DROP COLUMN IF EXISTS "description"`);
    await queryRunner.query(`ALTER TABLE "portfolios" DROP COLUMN IF EXISTS "longitude"`);
    await queryRunner.query(`ALTER TABLE "portfolios" DROP COLUMN IF EXISTS "latitude"`);
    await queryRunner.query(`ALTER TABLE "portfolios" DROP COLUMN IF EXISTS "address"`);
    await queryRunner.query(`ALTER TABLE "portfolios" DROP COLUMN IF EXISTS "project_type"`);
    await queryRunner.query(`ALTER TABLE "portfolios" DROP COLUMN IF EXISTS "project_status"`);
    await queryRunner.query(`ALTER TABLE "portfolios" DROP COLUMN IF EXISTS "media_url"`);
    await queryRunner.query(`ALTER TABLE "portfolios" DROP COLUMN IF EXISTS "media_type"`);

    await queryRunner.query(`ALTER TABLE "company_settings" DROP COLUMN IF EXISTS "company_longitude"`);
    await queryRunner.query(`ALTER TABLE "company_settings" DROP COLUMN IF EXISTS "company_latitude"`);
    await queryRunner.query(`ALTER TABLE "company_settings" DROP COLUMN IF EXISTS "hide_advanced_routes"`);
    await queryRunner.query(`ALTER TABLE "company_settings" DROP COLUMN IF EXISTS "emi_tenure_rates"`);
    await queryRunner.query(`ALTER TABLE "company_settings" DROP COLUMN IF EXISTS "emi_tenures"`);
    await queryRunner.query(`ALTER TABLE "company_settings" DROP COLUMN IF EXISTS "emi_min_amount"`);
    await queryRunner.query(`ALTER TABLE "company_settings" DROP COLUMN IF EXISTS "emi_interest_rate"`);
    await queryRunner.query(`ALTER TABLE "company_settings" DROP COLUMN IF EXISTS "emi_enabled"`);
    await queryRunner.query(`ALTER TABLE "company_settings" DROP COLUMN IF EXISTS "whatsapp_popup"`);
    await queryRunner.query(`ALTER TABLE "company_settings" DROP COLUMN IF EXISTS "privacy_policy"`);
    await queryRunner.query(`ALTER TABLE "company_settings" DROP COLUMN IF EXISTS "terms_and_conditions"`);
    await queryRunner.query(`ALTER TABLE "company_settings" DROP COLUMN IF EXISTS "canonical_url"`);
    await queryRunner.query(`ALTER TABLE "company_settings" DROP COLUMN IF EXISTS "site_og_image"`);
    await queryRunner.query(`ALTER TABLE "company_settings" DROP COLUMN IF EXISTS "site_meta_keywords"`);
    await queryRunner.query(`ALTER TABLE "company_settings" DROP COLUMN IF EXISTS "site_meta_description"`);
    await queryRunner.query(`ALTER TABLE "company_settings" DROP COLUMN IF EXISTS "site_meta_title"`);
    await queryRunner.query(`ALTER TABLE "company_settings" DROP COLUMN IF EXISTS "copyright_year"`);
    await queryRunner.query(`ALTER TABLE "company_settings" DROP COLUMN IF EXISTS "footer_text"`);
    await queryRunner.query(`ALTER TABLE "company_settings" DROP COLUMN IF EXISTS "company_logo_public_id"`);
    await queryRunner.query(`ALTER TABLE "company_settings" DROP COLUMN IF EXISTS "company_logo"`);
  }
}

import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Reconciles the database with the current entity definitions:
 * - creates missing tables (entity_tags, entity_tag_links, portfolio_categories)
 * - adds missing columns (blog_categories.description/is_deleted, blogs.category_id/featured_status,
 *   blog_authors.avatar_public_id, hero_sections.secondary_cta_*)
 * - drops products.warranty_type (legacy, superseded by product_warranty_policies)
 * - renames FK constraints / indexes to the names TypeORM derives from the entities
 */
export class SyncEntitiesWithMilanovaSiteSchema1790900000000
  implements MigrationInterface
{
  name = 'SyncEntitiesWithMilanovaSiteSchema1790900000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "services" DROP CONSTRAINT IF EXISTS "FK_services_pillar_id"`,
    );
    await queryRunner.query(
      `ALTER TABLE "services" DROP CONSTRAINT IF EXISTS "FK_services_group_id"`,
    );
    await queryRunner.query(
      `ALTER TABLE "service_groups" DROP CONSTRAINT IF EXISTS "FK_service_groups_pillar_id"`,
    );
    await queryRunner.query(
      `ALTER TABLE "comparison_rows" DROP CONSTRAINT IF EXISTS "FK_comparison_rows_block"`,
    );
    await queryRunner.query(
      `ALTER TABLE "lead_consultations" DROP CONSTRAINT IF EXISTS "FK_lead_consultations_lead"`,
    );
    await queryRunner.query(
      `ALTER TABLE "blog_post_authors" DROP CONSTRAINT IF EXISTS "FK_blog_post_authors_author"`,
    );
    await queryRunner.query(
      `ALTER TABLE "blog_post_authors" DROP CONSTRAINT IF EXISTS "FK_blog_post_authors_post"`,
    );
    await queryRunner.query(
      `DROP INDEX IF EXISTS "public"."idx_services_pillar_order"`,
    );
    await queryRunner.query(
      `DROP INDEX IF EXISTS "public"."idx_services_group_id"`,
    );
    await queryRunner.query(
      `DROP INDEX IF EXISTS "public"."IDX_pricing_tiers_owner"`,
    );
    await queryRunner.query(
      `DROP INDEX IF EXISTS "public"."IDX_comparison_blocks_owner"`,
    );
    await queryRunner.query(
      `DROP INDEX IF EXISTS "public"."IDX_lead_consultations_calendly"`,
    );

    await queryRunner.query(
      `CREATE TABLE IF NOT EXISTS "entity_tags" (
        "id" SERIAL NOT NULL,
        "name" character varying(60) NOT NULL,
        "slug" character varying(90) NOT NULL,
        "is_deleted" boolean NOT NULL DEFAULT false,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "UQ_fa62d493c673a5c19bc317bbe46" UNIQUE ("name"),
        CONSTRAINT "UQ_35830ec5f4b2a940534adcdbfb1" UNIQUE ("slug"),
        CONSTRAINT "PK_0d280b4b4b63c39578ab86e8085" PRIMARY KEY ("id")
      )`,
    );
    await queryRunner.query(
      `CREATE TABLE IF NOT EXISTS "entity_tag_links" (
        "id" SERIAL NOT NULL,
        "entity_type" character varying(50) NOT NULL,
        "entity_id" bigint NOT NULL,
        "tag_id" integer NOT NULL,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "UQ_19a238d5d8a37f3db1f5f840cf7" UNIQUE ("entity_type", "entity_id", "tag_id"),
        CONSTRAINT "PK_f3866a205c4b0755abc1f9b2f29" PRIMARY KEY ("id")
      )`,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_1084c8932fc502d29cd6ea3127" ON "entity_tag_links" ("entity_type", "entity_id")`,
    );
    await queryRunner.query(
      `CREATE TABLE IF NOT EXISTS "portfolio_categories" (
        "id" SERIAL NOT NULL,
        "name" character varying(150) NOT NULL,
        "slug" character varying(200),
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "UQ_e63477b3409a7fa6f620f98ff38" UNIQUE ("name"),
        CONSTRAINT "PK_e1ebad1076e043277bea080a1cf" PRIMARY KEY ("id")
      )`,
    );

    await queryRunner.query(
      `ALTER TABLE "products" DROP COLUMN IF EXISTS "warranty_type"`,
    );
    await queryRunner.query(
      `ALTER TABLE "hero_sections" ADD COLUMN IF NOT EXISTS "secondary_cta_label" character varying(100)`,
    );
    await queryRunner.query(
      `ALTER TABLE "hero_sections" ADD COLUMN IF NOT EXISTS "secondary_cta_link" text`,
    );
    await queryRunner.query(
      `ALTER TABLE "blog_authors" ADD COLUMN IF NOT EXISTS "avatar_public_id" character varying(500)`,
    );
    await queryRunner.query(
      `ALTER TABLE "blog_categories" ADD COLUMN IF NOT EXISTS "description" character varying(500)`,
    );
    await queryRunner.query(
      `ALTER TABLE "blog_categories" ADD COLUMN IF NOT EXISTS "is_deleted" boolean NOT NULL DEFAULT false`,
    );
    await queryRunner.query(
      `ALTER TABLE "blogs" ADD COLUMN IF NOT EXISTS "category_id" integer`,
    );
    await queryRunner.query(
      `ALTER TABLE "blogs" ADD COLUMN IF NOT EXISTS "featured_status" boolean NOT NULL DEFAULT false`,
    );

    await queryRunner.query(
      `UPDATE "hero_sections" SET "headline" = '' WHERE "headline" IS NULL`,
    );
    await queryRunner.query(
      `UPDATE "hero_sections" SET "sub_headline" = '' WHERE "sub_headline" IS NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "hero_sections" ALTER COLUMN "headline" SET NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "hero_sections" ALTER COLUMN "sub_headline" SET NOT NULL`,
    );

    // Every ADD CONSTRAINT below is preceded by a DROP CONSTRAINT IF EXISTS of
    // the same name, mirroring the block at the top of this method. Without the
    // drop, a database whose schema was already synced out-of-band aborts the
    // whole pending batch with 42710 "constraint ... already exists" even
    // though the constraint is already exactly the one being added.
    const renameFk = async (table: string, name: string, definition: string) => {
      await queryRunner.query(
        `ALTER TABLE "${table}" DROP CONSTRAINT IF EXISTS "${name}"`,
      );
      await queryRunner.query(
        `ALTER TABLE "${table}" ADD CONSTRAINT "${name}" ${definition}`,
      );
    };

    await renameFk(
      "entity_tag_links",
      "FK_7223146901fb2774971a2652b8e",
      `FOREIGN KEY ("tag_id") REFERENCES "entity_tags"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await renameFk(
      "services",
      "FK_451bbfd8e869daffaab7f0c6126",
      `FOREIGN KEY ("pillar_id") REFERENCES "service_pillars"("id") ON DELETE SET NULL ON UPDATE NO ACTION`,
    );
    await renameFk(
      "services",
      "FK_09de0c08fbd0efe76776deaabaf",
      `FOREIGN KEY ("group_id") REFERENCES "service_groups"("id") ON DELETE SET NULL ON UPDATE NO ACTION`,
    );
    await renameFk(
      "service_groups",
      "FK_1ba55d11f6dac3a18a25510f4ba",
      `FOREIGN KEY ("pillar_id") REFERENCES "service_pillars"("id") ON DELETE SET NULL ON UPDATE NO ACTION`,
    );
    await renameFk(
      "comparison_rows",
      "FK_5992777eeba213c69a1b416f09d",
      `FOREIGN KEY ("comparison_block_id") REFERENCES "comparison_blocks"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await renameFk(
      "lead_consultations",
      "FK_0ad83a3d0d8c5464edb0b2ecdc3",
      `FOREIGN KEY ("lead_id") REFERENCES "leads"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await renameFk(
      "blog_post_authors",
      "FK_6cbd9ae7f26020145a8ce46d81e",
      `FOREIGN KEY ("post_id") REFERENCES "blogs"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await renameFk(
      "blog_post_authors",
      "FK_995a8f9bc957eb12fd24b5a23af",
      `FOREIGN KEY ("author_id") REFERENCES "blog_authors"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await renameFk(
      "blogs",
      "FK_1f073a9f9720fe731423f1064cc",
      `FOREIGN KEY ("category_id") REFERENCES "blog_categories"("id") ON DELETE SET NULL ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "blogs" DROP CONSTRAINT IF EXISTS "FK_1f073a9f9720fe731423f1064cc"`,
    );
    await queryRunner.query(
      `ALTER TABLE "blog_post_authors" DROP CONSTRAINT IF EXISTS "FK_995a8f9bc957eb12fd24b5a23af"`,
    );
    await queryRunner.query(
      `ALTER TABLE "blog_post_authors" DROP CONSTRAINT IF EXISTS "FK_6cbd9ae7f26020145a8ce46d81e"`,
    );
    await queryRunner.query(
      `ALTER TABLE "lead_consultations" DROP CONSTRAINT IF EXISTS "FK_0ad83a3d0d8c5464edb0b2ecdc3"`,
    );
    await queryRunner.query(
      `ALTER TABLE "comparison_rows" DROP CONSTRAINT IF EXISTS "FK_5992777eeba213c69a1b416f09d"`,
    );
    await queryRunner.query(
      `ALTER TABLE "service_groups" DROP CONSTRAINT IF EXISTS "FK_1ba55d11f6dac3a18a25510f4ba"`,
    );
    await queryRunner.query(
      `ALTER TABLE "services" DROP CONSTRAINT IF EXISTS "FK_09de0c08fbd0efe76776deaabaf"`,
    );
    await queryRunner.query(
      `ALTER TABLE "services" DROP CONSTRAINT IF EXISTS "FK_451bbfd8e869daffaab7f0c6126"`,
    );
    await queryRunner.query(
      `ALTER TABLE "entity_tag_links" DROP CONSTRAINT IF EXISTS "FK_7223146901fb2774971a2652b8e"`,
    );
    await queryRunner.query(
      `ALTER TABLE "hero_sections" ALTER COLUMN "sub_headline" DROP NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "hero_sections" ALTER COLUMN "headline" DROP NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "blogs" DROP COLUMN IF EXISTS "featured_status"`,
    );
    await queryRunner.query(`ALTER TABLE "blogs" DROP COLUMN IF EXISTS "category_id"`);
    await queryRunner.query(
      `ALTER TABLE "blog_categories" DROP COLUMN IF EXISTS "is_deleted"`,
    );
    await queryRunner.query(
      `ALTER TABLE "blog_categories" DROP COLUMN IF EXISTS "description"`,
    );
    await queryRunner.query(
      `ALTER TABLE "blog_authors" DROP COLUMN IF EXISTS "avatar_public_id"`,
    );
    await queryRunner.query(
      `ALTER TABLE "hero_sections" DROP COLUMN IF EXISTS "secondary_cta_link"`,
    );
    await queryRunner.query(
      `ALTER TABLE "hero_sections" DROP COLUMN IF EXISTS "secondary_cta_label"`,
    );
    await queryRunner.query(
      `ALTER TABLE "products" ADD COLUMN IF NOT EXISTS "warranty_type" character varying(50) DEFAULT 'official'`,
    );
    await queryRunner.query(`DROP TABLE IF EXISTS "portfolio_categories"`);
    await queryRunner.query(
      `DROP INDEX IF EXISTS "public"."IDX_1084c8932fc502d29cd6ea3127"`,
    );
    await queryRunner.query(`DROP TABLE IF EXISTS "entity_tag_links"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "entity_tags"`);
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_lead_consultations_calendly" ON "lead_consultations" ("calendly_event_id")`,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_comparison_blocks_owner" ON "comparison_blocks" ("entity_type", "entity_id")`,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_pricing_tiers_owner" ON "pricing_tiers" ("entity_type", "entity_id")`,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "idx_services_group_id" ON "services" ("group_id")`,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "idx_services_pillar_order" ON "services" ("pillar", "display_order") WHERE (is_deleted = false)`,
    );
    await queryRunner.query(
      `ALTER TABLE "blog_post_authors" ADD CONSTRAINT "FK_blog_post_authors_post" FOREIGN KEY ("post_id") REFERENCES "blogs"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "blog_post_authors" ADD CONSTRAINT "FK_blog_post_authors_author" FOREIGN KEY ("author_id") REFERENCES "blog_authors"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "lead_consultations" ADD CONSTRAINT "FK_lead_consultations_lead" FOREIGN KEY ("lead_id") REFERENCES "leads"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "comparison_rows" ADD CONSTRAINT "FK_comparison_rows_block" FOREIGN KEY ("comparison_block_id") REFERENCES "comparison_blocks"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "service_groups" ADD CONSTRAINT "FK_service_groups_pillar_id" FOREIGN KEY ("pillar_id") REFERENCES "service_pillars"("id") ON DELETE SET NULL ON UPDATE CASCADE`,
    );
    await queryRunner.query(
      `ALTER TABLE "services" ADD CONSTRAINT "FK_services_group_id" FOREIGN KEY ("group_id") REFERENCES "service_groups"("id") ON DELETE SET NULL ON UPDATE CASCADE`,
    );
    await queryRunner.query(
      `ALTER TABLE "services" ADD CONSTRAINT "FK_services_pillar_id" FOREIGN KEY ("pillar_id") REFERENCES "service_pillars"("id") ON DELETE SET NULL ON UPDATE CASCADE`,
    );
  }
}

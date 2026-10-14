import { MigrationInterface, QueryRunner } from 'typeorm';

export class MilanovaGapFill1790000000000 implements MigrationInterface {
  name = 'MilanovaGapFill1790000000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // ── Office Hubs ──────────────────────────────────────────────
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "office_hubs" (
        "id" SERIAL PRIMARY KEY,
        "hub_name" character varying(255) NOT NULL,
        "address" text,
        "phone" character varying(50),
        "email" character varying(255),
        "is_headquarters" boolean NOT NULL DEFAULT false,
        "map_embed_url" character varying(500),
        "display_order" integer NOT NULL DEFAULT 0,
        "is_active" boolean NOT NULL DEFAULT true,
        "is_deleted" boolean NOT NULL DEFAULT false,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP NOT NULL DEFAULT now()
      )
    `);

    // ── Certificates ─────────────────────────────────────────────
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "certificates" (
        "id" SERIAL PRIMARY KEY,
        "name" character varying(255) NOT NULL,
        "issuing_authority" character varying(255),
        "year" integer,
        "badge_image_url" character varying(500),
        "verification_link" character varying(500),
        "display_locations" jsonb,
        "is_active" boolean NOT NULL DEFAULT true,
        "is_deleted" boolean NOT NULL DEFAULT false,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP NOT NULL DEFAULT now()
      )
    `);

    // ── Compliance Documents ─────────────────────────────────────
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "compliance_documents" (
        "id" SERIAL PRIMARY KEY,
        "title" character varying(255) NOT NULL,
        "issuing_authority" character varying(255),
        "reg_id" character varying(255),
        "file_url" character varying(500),
        "display_mode" character varying(50) NOT NULL DEFAULT 'viewer',
        "display_locations" jsonb,
        "is_active" boolean NOT NULL DEFAULT true,
        "is_deleted" boolean NOT NULL DEFAULT false,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP NOT NULL DEFAULT now()
      )
    `);

    // ── Services (3-Pillar) ──────────────────────────────────────
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "services" (
        "id" SERIAL PRIMARY KEY,
        "name" character varying(255) NOT NULL,
        "pillar" character varying(100) NOT NULL,
        "description" text,
        "icon_url" character varying(500),
        "display_order" integer NOT NULL DEFAULT 0,
        "is_active" boolean NOT NULL DEFAULT true,
        "is_deleted" boolean NOT NULL DEFAULT false,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP NOT NULL DEFAULT now()
      )
    `);

    // ── Client Logos ─────────────────────────────────────────────
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "client_logos" (
        "id" SERIAL PRIMARY KEY,
        "company_name" character varying(255) NOT NULL,
        "logo_url" character varying(500),
        "website_url" character varying(500),
        "display_order" integer NOT NULL DEFAULT 0,
        "status" character varying(50) NOT NULL DEFAULT 'active',
        "is_deleted" boolean NOT NULL DEFAULT false,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP NOT NULL DEFAULT now()
      )
    `);

    // ── Pricing Tiers ────────────────────────────────────────────
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "pricing_tiers" (
        "id" SERIAL PRIMARY KEY,
        "entity_type" character varying(50) NOT NULL,
        "entity_id" integer NOT NULL,
        "tier_title" character varying(255) NOT NULL,
        "primary_price" NUMERIC(12,2),
        "primary_currency" character varying(10) NOT NULL DEFAULT 'USD',
        "regional_prices" jsonb,
        "billing_cycle" character varying(50) NOT NULL DEFAULT 'one-time',
        "included_features" jsonb,
        "badge_text" character varying(100),
        "cta_text" character varying(255),
        "cta_link" character varying(500),
        "is_most_popular" boolean NOT NULL DEFAULT false,
        "display_order" integer NOT NULL DEFAULT 0,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP NOT NULL DEFAULT now()
      )
    `);
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_pricing_tiers_owner"
        ON "pricing_tiers" ("entity_type", "entity_id")
    `);

    // ── Comparison Blocks & Rows ─────────────────────────────────
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "comparison_blocks" (
        "id" SERIAL PRIMARY KEY,
        "entity_type" character varying(50) NOT NULL,
        "entity_id" integer NOT NULL,
        "enabled" boolean NOT NULL DEFAULT true,
        "title" character varying(255),
        "subtitle" character varying(255),
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP NOT NULL DEFAULT now()
      )
    `);
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_comparison_blocks_owner"
        ON "comparison_blocks" ("entity_type", "entity_id")
    `);
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "comparison_rows" (
        "id" SERIAL PRIMARY KEY,
        "comparison_block_id" integer NOT NULL,
        "standard_approach" text,
        "our_approach" text,
        "display_order" integer NOT NULL DEFAULT 0,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "FK_comparison_rows_block"
          FOREIGN KEY ("comparison_block_id")
          REFERENCES "comparison_blocks"("id")
          ON DELETE CASCADE
      )
    `);

    // ── Lead Consultations ───────────────────────────────────────
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "lead_consultations" (
        "id" SERIAL PRIMARY KEY,
        "lead_id" integer NOT NULL,
        "scheduled_at" TIMESTAMP,
        "timezone" character varying(100),
        "calendly_event_id" character varying(500),
        "meeting_link" character varying(500),
        "meeting_status" character varying(50) NOT NULL DEFAULT 'scheduled',
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "FK_lead_consultations_lead"
          FOREIGN KEY ("lead_id")
          REFERENCES "leads"("id")
          ON DELETE CASCADE
      )
    `);
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_lead_consultations_calendly"
        ON "lead_consultations" ("calendly_event_id")
    `);

    // ── Blog Categories / Authors ────────────────────────────────
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "blog_categories" (
        "id" SERIAL PRIMARY KEY,
        "name" character varying(150) NOT NULL,
        "slug" character varying(200),
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "UQ_blog_categories_name" UNIQUE ("name")
      )
    `);
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "blog_authors" (
        "id" SERIAL PRIMARY KEY,
        "name" character varying(255) NOT NULL,
        "designation" character varying(255),
        "avatar_url" character varying(500),
        "bio" text,
        "linkedin_url" character varying(500),
        "created_at" TIMESTAMP NOT NULL DEFAULT now()
      )
    `);
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "blog_post_authors" (
        "id" SERIAL PRIMARY KEY,
        "post_id" bigint NOT NULL,
        "author_id" integer NOT NULL,
        "is_primary" boolean NOT NULL DEFAULT false,
        "display_order" integer NOT NULL DEFAULT 0,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "FK_blog_post_authors_post"
          FOREIGN KEY ("post_id")
          REFERENCES "blogs"("id")
          ON DELETE CASCADE,
        CONSTRAINT "FK_blog_post_authors_author"
          FOREIGN KEY ("author_id")
          REFERENCES "blog_authors"("id")
          ON DELETE CASCADE
      )
    `);

    // ── Lead table: new CRM columns ──────────────────────────────
    const leadCols: Array<[string, string]> = [
      ['source_channel', `character varying(100) DEFAULT 'Website Form'`],
      ['country', 'character varying(100)'],
      ['currency', 'character varying(10)'],
      ['est_deal_value', 'NUMERIC(12,2)'],
      ['source_page_url', 'character varying(500)'],
      ['client_ip', 'character varying(50)'],
      ['assigned_owner_id', 'integer'],
      ['follow_up_date', 'date'],
      ['follow_up_notes', 'text'],
      ['is_deleted', 'boolean NOT NULL DEFAULT false'],
    ];
    for (const [col, def] of leadCols) {
      const exists = await queryRunner.query(
        `SELECT 1 FROM information_schema.columns WHERE table_name='leads' AND column_name=$1`,
        [col],
      );
      if (exists.length === 0) {
        await queryRunner.query(`ALTER TABLE "leads" ADD COLUMN "${col}" ${def}`);
      }
    }

    // ── Blog table: scheduled_at ─────────────────────────────────
    const blogCol = await queryRunner.query(
      `SELECT 1 FROM information_schema.columns WHERE table_name='blogs' AND column_name='scheduled_at'`,
    );
    if (blogCol.length === 0) {
      await queryRunner.query(`ALTER TABLE "blogs" ADD COLUMN "scheduled_at" TIMESTAMP`);
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS "blog_post_authors"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "blog_authors"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "blog_categories"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "lead_consultations"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "comparison_rows"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "comparison_blocks"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "pricing_tiers"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "client_logos"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "services"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "compliance_documents"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "certificates"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "office_hubs"`);

    const leadCols = [
      'source_channel', 'country', 'currency', 'est_deal_value',
      'source_page_url', 'client_ip', 'assigned_owner_id',
      'follow_up_date', 'follow_up_notes', 'is_deleted',
    ];
    for (const col of leadCols) {
      const exists = await queryRunner.query(
        `SELECT 1 FROM information_schema.columns WHERE table_name='leads' AND column_name=$1`,
        [col],
      );
      if (exists.length > 0) {
        await queryRunner.query(`ALTER TABLE "leads" DROP COLUMN "${col}"`);
      }
    }

    const blogCol = await queryRunner.query(
      `SELECT 1 FROM information_schema.columns WHERE table_name='blogs' AND column_name='scheduled_at'`,
    );
    if (blogCol.length > 0) {
      await queryRunner.query(`ALTER TABLE "blogs" DROP COLUMN "scheduled_at"`);
    }
  }
}
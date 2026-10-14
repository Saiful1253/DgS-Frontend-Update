import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Aligns the catalogue product tables with the `src/products/` entities.
 *
 * The previous version of this migration assumed all five tables were new and
 * used `CREATE TABLE IF NOT EXISTS` for each. They are not new: `products`,
 * `product_categories`, `product_images` and `brands` all predate this module
 * and hold live e-commerce data (21 products, 24 categories, 20 images, 11
 * brands). `CREATE TABLE IF NOT EXISTS` therefore skipped every one of them
 * silently, after which the migration added `FK_products_brand_id` pointing at a
 * freshly created *empty* `product_brands` while all 21 products referenced the
 * pre-existing `brands` table. That aborted the whole pending batch with
 * 23503 "Key (brand_id)=(1) is not present in table product_brands".
 *
 * So this version treats the existing tables as the source of truth and only
 * adds what the entities are missing. It never drops or renames a populated
 * table into a new shape; the single rename (`brands` -> `product_brands`)
 * carries the rows across.
 *
 * ID columns stay `bigint`. Eight legacy tables (`product_variants`,
 * `product_images`, `product_serial_numbers`, `product_warranty_policies`,
 * `product_purchase_warranties`, `stock_logs`, `store_inventory`,
 * `service_jobs`) hold foreign keys into `products(id)`, so narrowing that key
 * to `integer` would mean dropping and recreating all eight. The existing
 * `blogs`, `users` and `hero_sections` primary keys are `bigint` too.
 *
 * Every statement is guarded so the migration is safe to re-run on a partially
 * provisioned database.
 */
export class CreateProductsCatalogueTables1791000000000 implements MigrationInterface {
  name = 'CreateProductsCatalogueTables1791000000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // ── brands -> product_brands ─────────────────────────────────────────────
    // The `Brand` entity was removed in the products -> products_saas migration
    // (764fb21), leaving `brands` as a table with no entity and 11 live rows.
    // `product_brands` was only ever an empty placeholder created by the broken
    // version of this migration. Renaming carries the rows, the primary key and
    // the `brands_id_seq` sequence across; any foreign key that referenced
    // `brands` follows the rename automatically.
    await queryRunner.query(`
      DO $$
      BEGIN
        IF to_regclass('public.brands') IS NOT NULL
           AND to_regclass('public.product_brands') IS NULL THEN
          EXECUTE 'ALTER TABLE "brands" RENAME TO "product_brands"';
        END IF;
      END $$
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "product_brands" (
        "id" BIGSERIAL PRIMARY KEY,
        "name" VARCHAR(200) NOT NULL,
        "slug" VARCHAR(220) NOT NULL UNIQUE,
        "logo_url" VARCHAR(500) NULL,
        "cloudinary_public_id" VARCHAR(200) NULL,
        "description" TEXT NULL,
        "website_url" VARCHAR(500) NULL,
        "status" VARCHAR(20) NOT NULL DEFAULT 'active',
        "is_deleted" BOOLEAN NOT NULL DEFAULT false,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP NOT NULL DEFAULT now()
      )
    `);

    // `logo_url`/`website_url` were widened from the legacy types; varchar
    // truncation is the only risk and both hold short values today.
    await queryRunner.query(
      `ALTER TABLE "product_brands" ADD COLUMN IF NOT EXISTS "cloudinary_public_id" character varying(200)`,
    );
    await queryRunner.query(
      `ALTER TABLE "product_brands" ALTER COLUMN "logo_url" TYPE character varying(500)`,
    );
    await queryRunner.query(
      `ALTER TABLE "product_brands" ALTER COLUMN "website_url" TYPE character varying(500)`,
    );
    await queryRunner.query(
      `ALTER TABLE "product_brands" ADD COLUMN IF NOT EXISTS "status" character varying(20) NOT NULL DEFAULT 'active'`,
    );
    await queryRunner.query(
      `ALTER TABLE "product_brands" ADD COLUMN IF NOT EXISTS "is_deleted" boolean NOT NULL DEFAULT false`,
    );

    // ── product_categories ───────────────────────────────────────────────────
    // Already present with 24 legacy rows. The entity adds cloudinary_public_id
    // and sort_order; without the former every read of ProductCategory fails
    // with 42703 "column ProductCategory.cloudinary_public_id does not exist".
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "product_categories" (
        "id" BIGSERIAL PRIMARY KEY,
        "name" VARCHAR(200) NOT NULL,
        "slug" VARCHAR(220) NOT NULL UNIQUE,
        "description" TEXT NULL,
        "image_url" VARCHAR(500) NULL,
        "cloudinary_public_id" VARCHAR(200) NULL,
        "parent_id" BIGINT NULL,
        "status" VARCHAR(20) NOT NULL DEFAULT 'active',
        "sort_order" INT NOT NULL DEFAULT 0,
        "is_deleted" BOOLEAN NOT NULL DEFAULT false,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP NOT NULL DEFAULT now()
      )
    `);

    await queryRunner.query(
      `ALTER TABLE "product_categories" ADD COLUMN IF NOT EXISTS "cloudinary_public_id" character varying(200)`,
    );
    await queryRunner.query(
      `ALTER TABLE "product_categories" ADD COLUMN IF NOT EXISTS "sort_order" integer NOT NULL DEFAULT 0`,
    );
    await queryRunner.query(
      `ALTER TABLE "product_categories" ADD COLUMN IF NOT EXISTS "image_url" character varying(500)`,
    );
    await queryRunner.query(
      `ALTER TABLE "product_categories" ADD COLUMN IF NOT EXISTS "description" text`,
    );
    await queryRunner.query(
      `ALTER TABLE "product_categories" ADD COLUMN IF NOT EXISTS "status" character varying(20) NOT NULL DEFAULT 'active'`,
    );
    await queryRunner.query(
      `ALTER TABLE "product_categories" ADD COLUMN IF NOT EXISTS "is_deleted" boolean NOT NULL DEFAULT false`,
    );

    // ── products ─────────────────────────────────────────────────────────────
    // Already present with 21 legacy rows, keyed bigint.
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "products" (
        "id" BIGSERIAL PRIMARY KEY,
        "name" VARCHAR(200) NOT NULL,
        "slug" VARCHAR(220) NOT NULL UNIQUE,
        "category_id" BIGINT NOT NULL,
        "brand_id" BIGINT NULL,
        "description" TEXT NOT NULL,
        "base_price" NUMERIC(12,2) NOT NULL DEFAULT 0,
        "weight_grams" NUMERIC(12,2) NULL,
        "discount_type" VARCHAR(20) NOT NULL DEFAULT 'none',
        "discount_value" NUMERIC(12,2) NULL,
        "warranty_components" JSONB NULL,
        "country_of_origin" VARCHAR(100) NULL,
        "serial_number" VARCHAR(100) NULL,
        "emi_available" BOOLEAN NOT NULL DEFAULT false,
        "product_video_url" VARCHAR(500) NULL,
        "specifications_json" JSONB NULL,
        "status" VARCHAR(20) NOT NULL DEFAULT 'active',
        "is_featured" BOOLEAN NOT NULL DEFAULT false,
        "low_stock_threshold" INT NOT NULL DEFAULT 10,
        "lifecycle_months" INT NOT NULL DEFAULT 6,
        "default_shelf_life_days" INT NOT NULL DEFAULT 30,
        "is_deleted" BOOLEAN NOT NULL DEFAULT false,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP NOT NULL DEFAULT now()
      )
    `);

    await queryRunner.query(
      `ALTER TABLE "products" ADD COLUMN IF NOT EXISTS "warranty_components" jsonb`,
    );
    await queryRunner.query(
      `ALTER TABLE "products" ADD COLUMN IF NOT EXISTS "low_stock_threshold" integer NOT NULL DEFAULT 10`,
    );
    await queryRunner.query(
      `ALTER TABLE "products" ADD COLUMN IF NOT EXISTS "lifecycle_months" integer NOT NULL DEFAULT 6`,
    );
    await queryRunner.query(
      `ALTER TABLE "products" ADD COLUMN IF NOT EXISTS "default_shelf_life_days" integer NOT NULL DEFAULT 30`,
    );
    await queryRunner.query(
      `ALTER TABLE "products" ADD COLUMN IF NOT EXISTS "emi_available" boolean NOT NULL DEFAULT false`,
    );
    await queryRunner.query(
      `ALTER TABLE "products" ADD COLUMN IF NOT EXISTS "product_video_url" character varying(500)`,
    );
    await queryRunner.query(
      `ALTER TABLE "products" ADD COLUMN IF NOT EXISTS "specifications_json" jsonb`,
    );

    // The entity declares these NOT NULL; 7 legacy rows have a NULL
    // discount_type and the column is currently nullable, so backfill before
    // tightening.
    await queryRunner.query(
      `UPDATE "products" SET "discount_type" = 'none' WHERE "discount_type" IS NULL`,
    );
    await queryRunner.query(
      `UPDATE "products" SET "description" = '' WHERE "description" IS NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "products" ALTER COLUMN "discount_type" SET NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "products" ALTER COLUMN "description" SET NOT NULL`,
    );
    // `category_id` is NOT NULL on the entity and the admin's create/update
    // paths call assertCategory, but the legacy column is nullable. No row has
    // a NULL today (verified before tightening).
    await queryRunner.query(
      `ALTER TABLE "products" ALTER COLUMN "category_id" SET NOT NULL`,
    );

    // `final_price` was a derived column from the legacy storefront. The entity
    // computes the effective price from base_price + discount_type/discount_value
    // in the service, so the stored copy can only go stale. Dropped here, after
    // the discount columns above are guaranteed present.
    await queryRunner.query(
      `ALTER TABLE "products" DROP COLUMN IF EXISTS "final_price"`,
    );

    // ── product_images ───────────────────────────────────────────────────────
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "product_images" (
        "id" BIGSERIAL PRIMARY KEY,
        "product_id" BIGINT NOT NULL,
        "image_url" VARCHAR(500) NOT NULL,
        "cloudinary_public_id" VARCHAR(200) NULL,
        "is_primary" BOOLEAN NOT NULL DEFAULT false,
        "sort_order" INT NOT NULL DEFAULT 0,
        "created_at" TIMESTAMP NOT NULL DEFAULT now()
      )
    `);

    await queryRunner.query(
      `ALTER TABLE "product_images" ADD COLUMN IF NOT EXISTS "sort_order" integer NOT NULL DEFAULT 0`,
    );
    await queryRunner.query(
      `ALTER TABLE "product_images" ADD COLUMN IF NOT EXISTS "created_at" timestamp NOT NULL DEFAULT now()`,
    );

    // ── product_category_attributes ──────────────────────────────────────────
    // The only genuinely new table: it did not exist in any prior shape.
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "product_category_attributes" (
        "id" BIGSERIAL PRIMARY KEY,
        "category_id" BIGINT NOT NULL,
        "name" VARCHAR(200) NOT NULL,
        "unit" VARCHAR(50) NULL,
        "is_filterable" BOOLEAN NOT NULL DEFAULT false,
        "sort_order" INT NOT NULL DEFAULT 0,
        "is_deleted" BOOLEAN NOT NULL DEFAULT false,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP NOT NULL DEFAULT now()
      )
    `);

    // ── Foreign keys ─────────────────────────────────────────────────────────
    // The legacy constraints were created under TypeORM's hashed names, so
    // dropping by the new name would be a no-op and the ADD would then fail
    // with 42710 on a database that already had one. Drop the old definitions
    // first, then add the named ones the entities expect. The `brands` ->
    // `product_brands` rename above has already repointed FK_1530a6f15d3c79d1b70be98f2be
    // at the renamed table, so it is safe to drop here.
    await queryRunner.query(
      `ALTER TABLE "products" DROP CONSTRAINT IF EXISTS "FK_1530a6f15d3c79d1b70be98f2be"`,
    );
    await queryRunner.query(
      `ALTER TABLE "products" DROP CONSTRAINT IF EXISTS "FK_9a5f6868c96e0069e699f33e124"`,
    );
    await queryRunner.query(
      `ALTER TABLE "product_images" DROP CONSTRAINT IF EXISTS "FK_4f166bb8c2bfcef2498d97b4068"`,
    );
    await queryRunner.query(
      `ALTER TABLE "product_categories" DROP CONSTRAINT IF EXISTS "FK_5f151d414daab0290f65b517ed4"`,
    );

    const setFk = async (
      table: string,
      name: string,
      column: string,
      target: string,
      onDelete: string,
    ) => {
      await queryRunner.query(
        `ALTER TABLE "${table}" DROP CONSTRAINT IF EXISTS "${name}"`,
      );
      await queryRunner.query(
        `ALTER TABLE "${table}" ADD CONSTRAINT "${name}" FOREIGN KEY ("${column}") REFERENCES "${target}"("id") ON DELETE ${onDelete}`,
      );
    };

    await setFk(
      'products',
      'FK_products_brand_id',
      'brand_id',
      'product_brands',
      'SET NULL',
    );
    await setFk(
      'products',
      'FK_products_category_id',
      'category_id',
      'product_categories',
      'RESTRICT',
    );
    await setFk(
      'product_categories',
      'FK_product_categories_parent_id',
      'parent_id',
      'product_categories',
      'SET NULL',
    );
    await setFk(
      'product_images',
      'FK_product_images_product_id',
      'product_id',
      'products',
      'CASCADE',
    );
    await setFk(
      'product_category_attributes',
      'FK_product_category_attributes_category_id',
      'category_id',
      'product_categories',
      'CASCADE',
    );

    // ── Indexes ──────────────────────────────────────────────────────────────
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_products_is_deleted" ON "products" ("is_deleted")`,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_products_category_id" ON "products" ("category_id")`,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_products_brand_id" ON "products" ("brand_id")`,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_product_images_product_id" ON "product_images" ("product_id")`,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_product_categories_parent_id" ON "product_categories" ("parent_id")`,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_product_brands_is_deleted" ON "product_brands" ("is_deleted")`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS "product_category_attributes"`);

    await queryRunner.query(
      `ALTER TABLE "products" DROP CONSTRAINT IF EXISTS "FK_products_brand_id"`,
    );
    await queryRunner.query(
      `ALTER TABLE "products" DROP CONSTRAINT IF EXISTS "FK_products_category_id"`,
    );
    await queryRunner.query(
      `ALTER TABLE "product_images" DROP CONSTRAINT IF EXISTS "FK_product_images_product_id"`,
    );
    await queryRunner.query(
      `ALTER TABLE "product_categories" DROP CONSTRAINT IF EXISTS "FK_product_categories_parent_id"`,
    );

    await queryRunner.query(
      `ALTER TABLE "products" DROP COLUMN IF EXISTS "default_shelf_life_days"`,
    );
    await queryRunner.query(
      `ALTER TABLE "products" DROP COLUMN IF EXISTS "lifecycle_months"`,
    );
    await queryRunner.query(
      `ALTER TABLE "products" DROP COLUMN IF EXISTS "low_stock_threshold"`,
    );
    await queryRunner.query(
      `ALTER TABLE "products" DROP COLUMN IF EXISTS "warranty_components"`,
    );
    await queryRunner.query(
      `ALTER TABLE "product_categories" DROP COLUMN IF EXISTS "sort_order"`,
    );
    await queryRunner.query(
      `ALTER TABLE "product_categories" DROP COLUMN IF EXISTS "cloudinary_public_id"`,
    );
    await queryRunner.query(
      `ALTER TABLE "product_images" DROP COLUMN IF EXISTS "sort_order"`,
    );

    // Restore the pre-migration name. Only safe while nothing references the
    // renamed table, which is why it is last.
    await queryRunner.query(`
      DO $$
      BEGIN
        IF to_regclass('public.product_brands') IS NOT NULL
           AND to_regclass('public.brands') IS NULL THEN
          EXECUTE 'ALTER TABLE "product_brands" RENAME TO "brands"';
        END IF;
      END $$
    `);
  }
}

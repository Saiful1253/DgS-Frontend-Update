import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Backs `TechnologyCategory` (src/technologies/entities/technology-category.entity.ts).
 *
 * The entity, module registration, controller CRUD and service methods for
 * dynamic technology categories all shipped without a matching migration, so
 * `GET/POST/PUT/DELETE /technologies/categories` failed with
 * `relation "technology_categories" does not exist` on any database that was
 * provisioned through migrations rather than DB_SYNCHRONIZE=true.
 *
 * `technologies.category` stays a plain varchar(100) — the admin filter chips
 * are keyed on the category *name*, and `TechnologiesService.updateCategory`
 * already cascades renames onto that column by name. This migration therefore
 * only guarantees the row set exists and is complete, it does not introduce a
 * foreign key.
 *
 * Every statement is IF [NOT] EXISTS / ON CONFLICT guarded, so the migration is
 * safe to re-run on a partially provisioned database.
 */
export class CreateTechnologyCategoriesTable1791100000000 implements MigrationInterface {
  name = 'CreateTechnologyCategoriesTable1791100000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "technology_categories" (
        "id" SERIAL PRIMARY KEY,
        "name" VARCHAR(120) NOT NULL UNIQUE,
        "display_order" INT NOT NULL DEFAULT 0,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP NOT NULL DEFAULT now()
      )
    `);

    // The canonical bucket list, in the same order as the admin panel's
    // TECHNOLOGY_CATEGORIES constant (src/types/technology.ts), which
    // `sortCategories` uses as its rank map.
    await queryRunner.query(`
      INSERT INTO "technology_categories" ("name", "display_order")
      VALUES
        ('Frontend', 1),
        ('Backend', 2),
        ('Mobile', 3),
        ('Database', 4),
        ('Cloud', 5),
        ('DevOps', 6),
        ('AI & Automation', 7),
        ('Low-Code', 8),
        ('Image Tune', 9),
        ('Video Tune', 10),
        ('Analytics', 11),
        ('Digital Marketing', 12)
      ON CONFLICT ("name") DO NOTHING
    `);

    // `sortCategories` dedupes on the exact string, so a technology tagged
    // "frontend" would render as a second chip next to the "Frontend" one.
    // Snap existing values onto the canonical casing.
    await queryRunner.query(`
      UPDATE "technologies" t
      SET "category" = c.name
      FROM "technology_categories" c
      WHERE LOWER(BTRIM(t.category)) = LOWER(c.name)
        AND t.category <> c.name
    `);

    // Adopt any category name that is not on the canonical list (custom
    // buckets an admin created before this table existed, or a stray value
    // typed into the column) instead of leaving technologies pointing at a
    // category row that does not exist. Appended after the canonical 12 so the
    // admin sort order is preserved.
    await queryRunner.query(`
      INSERT INTO "technology_categories" ("name", "display_order")
      SELECT
        DISTINCT ON (BTRIM(t.category)) BTRIM(t.category),
        (SELECT COALESCE(MAX(tc.display_order), 0) FROM "technology_categories" tc)
          + ROW_NUMBER() OVER (ORDER BY BTRIM(t.category))
      FROM "technologies" t
      WHERE BTRIM(t.category) <> ''
        AND NOT EXISTS (
          SELECT 1 FROM "technology_categories" tc
          WHERE LOWER(tc.name) = LOWER(BTRIM(t.category))
        )
      ON CONFLICT ("name") DO NOTHING
    `);

    // findAllCategories orders by display_order, name.
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_technology_categories_display_order"
      ON "technology_categories" ("display_order")
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `DROP INDEX IF EXISTS "IDX_technology_categories_display_order"`,
    );
    await queryRunner.query(`DROP TABLE IF EXISTS "technology_categories"`);
  }
}

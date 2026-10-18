import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Adds the hero headline decoration columns the entity already declares:
 * - hero_sections.badge_text     — pill badge above the headline
 * - hero_sections.highlight_text — phrase to colorize inside the headline
 *
 * Without these the admin form saves nothing on a schema-synced-only dev DB
 * and errors on a migration-managed production DB.
 */
export class AddHeroBadgeAndHighlight1791300000000
  implements MigrationInterface
{
  name = 'AddHeroBadgeAndHighlight1791300000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "hero_sections" ADD COLUMN IF NOT EXISTS "badge_text" character varying(255)`,
    );
    await queryRunner.query(
      `ALTER TABLE "hero_sections" ADD COLUMN IF NOT EXISTS "highlight_text" character varying(150)`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "hero_sections" DROP COLUMN IF EXISTS "highlight_text"`,
    );
    await queryRunner.query(
      `ALTER TABLE "hero_sections" DROP COLUMN IF EXISTS "badge_text"`,
    );
  }
}

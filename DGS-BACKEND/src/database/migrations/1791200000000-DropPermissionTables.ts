import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Removes the RBAC permission system.
 *
 * The application no longer has permission-based access control — roles and
 * users remain, but every authenticated user has full access. This migration
 * drops the now-unused permission tables created by the initial schema.
 */
export class DropPermissionTables1791200000000 implements MigrationInterface {
  name = 'DropPermissionTables1791200000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS "user_permissions" CASCADE`);
    await queryRunner.query(`DROP TABLE IF EXISTS "role_permissions" CASCADE`);
    await queryRunner.query(`DROP TABLE IF EXISTS "permissions" CASCADE`);
    await queryRunner.query(`DROP INDEX IF EXISTS "idx_user_perm_user_id"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "idx_user_perm_permission_id"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "idx_user_perm_user_allowed"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "idx_role_perm_role_id"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "idx_role_perm_permission_id"`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "permissions" (
        "id" BIGSERIAL PRIMARY KEY,
        "code" VARCHAR(100) NOT NULL UNIQUE,
        "description" TEXT,
        "module" VARCHAR(50) NOT NULL,
        "created_at" TIMESTAMP NOT NULL DEFAULT NOW(),
        "updated_at" TIMESTAMP NOT NULL DEFAULT NOW()
      )
    `);
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "role_permissions" (
        "id" BIGSERIAL PRIMARY KEY,
        "role_id" BIGINT NOT NULL REFERENCES "roles"("id") ON DELETE CASCADE,
        "permission_id" BIGINT NOT NULL REFERENCES "permissions"("id") ON DELETE CASCADE
      )
    `);
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "user_permissions" (
        "id" BIGSERIAL PRIMARY KEY,
        "user_id" BIGINT NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
        "permission_id" BIGINT NOT NULL REFERENCES "permissions"("id") ON DELETE CASCADE,
        "allowed" BOOLEAN NOT NULL DEFAULT true,
        "inherited_from_role" BOOLEAN NOT NULL DEFAULT false,
        "created_at" TIMESTAMP NOT NULL DEFAULT NOW(),
        "updated_at" TIMESTAMP NOT NULL DEFAULT NOW()
      )
    `);
  }
}

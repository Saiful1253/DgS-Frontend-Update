import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Gates the shared Cloudinary upload endpoints behind a permission.
 *
 * `UploadController` previously ran `JwtAuthGuard` only, so any authenticated
 * account — including read-only roles — could write to and delete from the
 * shared Cloudinary account. This inserts the permission the controller now
 * requires and grants it to the roles that already had content write access.
 *
 * `super_admin` and `owner` are not listed: the seed grants them every code in
 * PERMISSIONS, and they are additionally granted every permission as a
 * user-level override.
 */
export class AddUploadMediaPermission1790700000000 implements MigrationInterface {
  name = 'AddUploadMediaPermission1790700000000';

  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      INSERT INTO permissions (code, description, module)
      SELECT
        'uploads.media.manage',
        'Upload and delete media assets in the shared Cloudinary account',
        'uploads'
      WHERE NOT EXISTS (
        SELECT 1 FROM permissions WHERE code = 'uploads.media.manage'
      )
    `);

    // editor_content_lead is the only non-privileged role with content write
    // access (cms, services, portfolio, products, testimonials, pricing).
    // super_admin / owner receive it automatically via the seed.
    await queryRunner.query(`
      INSERT INTO role_permissions (role_id, permission_id)
      SELECT r.id, p.id
      FROM roles r
      CROSS JOIN permissions p
      WHERE p.code = 'uploads.media.manage'
        AND r.name IN ('editor_content_lead', 'owner', 'super_admin')
        AND NOT EXISTS (
          SELECT 1
          FROM role_permissions rp
          WHERE rp.role_id = r.id AND rp.permission_id = p.id
        )
    `);

    // The primary admin accounts are seeded with an explicit user-level grant
    // for every permission. Mirror it here so they are not locked out of their
    // own upload endpoints before the next seed run.
    await queryRunner.query(`
      INSERT INTO user_permissions (user_id, permission_id, allowed, inherited_from_role, created_at, updated_at)
      SELECT u.id, p.id, true, false, now(), now()
      FROM users u
      CROSS JOIN permissions p
      WHERE p.code = 'uploads.media.manage'
        AND u.email IN ('admin@milanova.tech', 'shahnawazsazid60@gmail.com', 'admin@acharshop.com')
        AND NOT EXISTS (
          SELECT 1
          FROM user_permissions up
          WHERE up.user_id = u.id AND up.permission_id = p.id
        )
    `);
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      DELETE FROM user_permissions
      WHERE permission_id IN (
        SELECT id FROM permissions WHERE code = 'uploads.media.manage'
      )
    `);
    await queryRunner.query(`
      DELETE FROM role_permissions
      WHERE permission_id IN (
        SELECT id FROM permissions WHERE code = 'uploads.media.manage'
      )
    `);
    await queryRunner.query(`
      DELETE FROM permissions WHERE code = 'uploads.media.manage'
    `);
  }
}

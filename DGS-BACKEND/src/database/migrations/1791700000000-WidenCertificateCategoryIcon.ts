import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Widens `category_icon` on `certificates` from varchar(50) to varchar(500)
 * so it can store uploaded icon image URLs (Cloudinary / S3) instead of just
 * short icon keys.
 */
export class WidenCertificateCategoryIcon1791700000000
  implements MigrationInterface
{
  name = 'WidenCertificateCategoryIcon1791700000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "certificates" ALTER COLUMN "category_icon" TYPE character varying(500)`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "certificates" ALTER COLUMN "category_icon" TYPE character varying(50)`,
    );
  }
}

import { MigrationInterface, QueryRunner } from "typeorm";

export class CreatePortfolioAreasTable1792991000000 implements MigrationInterface {
  name = 'CreatePortfolioAreasTable1792991000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "portfolio_areas" (
        "id" SERIAL NOT NULL,
        "name" character varying(150) NOT NULL,
        "slug" character varying(200),
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_portfolio_areas_id" PRIMARY KEY ("id"),
        CONSTRAINT "UQ_portfolio_areas_name" UNIQUE ("name")
      )
    `);

    const initialAreas = [
      'Uttara',
      'Gulshan',
      'Banani',
      'Mirpur',
      'Dhanmondi',
      'Bashundhara R/A',
      'Motijheel',
      'Mohakhali',
      'Badda',
      'Baridhara',
      'Tejgaon',
      'Mohammadpur',
      'Khilgaon',
      'Basabo',
      'Old Dhaka',
      'Savar',
      'Ashulia',
      'Gazipur Sadar',
      'Tongi',
      'Narayanganj Sadar',
    ];

    for (const name of initialAreas) {
      const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
      await queryRunner.query(
        `INSERT INTO "portfolio_areas" ("name", "slug") VALUES ($1, $2) ON CONFLICT ("name") DO NOTHING`,
        [name, slug],
      );
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS "portfolio_areas"`);
  }
}

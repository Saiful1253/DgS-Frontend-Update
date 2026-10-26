import { MigrationInterface, QueryRunner } from "typeorm";

export class CreateWhatWeDoTable1792842613748 implements MigrationInterface {
  name = 'CreateWhatWeDoTable1792842613748';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "what_we_do" (
        "id" SERIAL NOT NULL,
        "category" character varying(100) NOT NULL,
        "is_available" boolean NOT NULL DEFAULT true,
        "problem" character varying(255) NOT NULL,
        "problem_desc" text NOT NULL,
        "solution" character varying(255) NOT NULL,
        "solution_desc" text NOT NULL,
        "sort_order" integer NOT NULL DEFAULT 0,
        "is_deleted" boolean NOT NULL DEFAULT false,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_what_we_do_id" PRIMARY KEY ("id")
      )
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_what_we_do_category_sort" ON "what_we_do" ("category", "sort_order")
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_what_we_do_category_sort"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "what_we_do"`);
  }
}

import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddServiceGroupIsActive1790800000000 implements MigrationInterface {
  name = 'AddServiceGroupIsActive1790800000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Groups publish independently of their services. The column defaults to
    // TRUE so every existing group stays visible: the previous public payload
    // derived groups from the services it received, so a group was already
    // public iff at least one live service referenced it.
    // IF NOT EXISTS: the column was already present on databases provisioned
    // out-of-band (synchronize), and the unguarded form aborted the whole
    // pending batch with 42701 "column is_active of relation service_groups
    // already exists", leaving every later migration unrun.
    await queryRunner.query(
      `ALTER TABLE "service_groups" ADD COLUMN IF NOT EXISTS "is_active" boolean NOT NULL DEFAULT true`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "service_groups" DROP COLUMN IF EXISTS "is_active"`,
    );
  }
}

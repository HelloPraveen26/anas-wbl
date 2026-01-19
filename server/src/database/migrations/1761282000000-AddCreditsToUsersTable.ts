import { MigrationInterface, QueryRunner } from "typeorm";

export class AddCreditsToUsersTable1761282000000 implements MigrationInterface {
  name = "AddCreditsToUsersTable1761282000000";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "users"
      ADD COLUMN "credits" numeric NOT NULL DEFAULT 0
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "users"
      DROP COLUMN "credits"
    `);
  }
}

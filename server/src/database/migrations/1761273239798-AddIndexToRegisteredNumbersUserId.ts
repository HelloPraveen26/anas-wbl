import { MigrationInterface, QueryRunner } from "typeorm";

export class AddIndexToRegisteredNumbersUserId1761273239798 implements MigrationInterface {
    name = 'AddIndexToRegisteredNumbersUserId1761273239798'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE INDEX "IDX_42c592cb1b563d1d9f9b68d561" ON "registered_numbers" ("user_id") `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP INDEX "public"."IDX_42c592cb1b563d1d9f9b68d561"`);
    }

}

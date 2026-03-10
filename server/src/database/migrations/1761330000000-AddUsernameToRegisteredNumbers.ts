import { MigrationInterface, QueryRunner } from "typeorm";

export class AddUsernameToRegisteredNumbers1761330000000 implements MigrationInterface {
    name = 'AddUsernameToRegisteredNumbers1761330000000'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "registered_numbers" ADD "username" character varying(255)`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "registered_numbers" DROP COLUMN "username"`);
    }

}

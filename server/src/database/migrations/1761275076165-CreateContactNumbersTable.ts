import { MigrationInterface, QueryRunner } from "typeorm";

export class CreateContactNumbersTable1761275076165 implements MigrationInterface {
    name = 'CreateContactNumbersTable1761275076165'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "contact_numbers" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "name" character varying(100) NOT NULL, "phone_no" character varying(20) NOT NULL, "user_id" uuid NOT NULL, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_f5733cf0d0034ad0b57fb822bb2" PRIMARY KEY ("id"))`);
        await queryRunner.query(`ALTER TABLE "contact_numbers" ADD CONSTRAINT "FK_0a24cc6b14fb7aafe421f7a6732" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "contact_numbers" DROP CONSTRAINT "FK_0a24cc6b14fb7aafe421f7a6732"`);
        await queryRunner.query(`DROP TABLE "contact_numbers"`);
    }

}

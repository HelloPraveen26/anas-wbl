import { MigrationInterface, QueryRunner } from "typeorm";

export class CreateRegisteredNumbersTable1761272889834 implements MigrationInterface {
    name = 'CreateRegisteredNumbersTable1761272889834'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "registered_numbers" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "provider_name" character varying(100) NOT NULL, "friendly_name" character varying(255) NOT NULL, "phone_no" character varying(20) NOT NULL, "livekit_outbound_trunk_id" character varying(255) NOT NULL, "active" boolean NOT NULL DEFAULT true, "user_id" uuid NOT NULL, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_953f41af7784626dfce3c7c8d2f" PRIMARY KEY ("id"))`);
        await queryRunner.query(`ALTER TABLE "registered_numbers" ADD CONSTRAINT "FK_42c592cb1b563d1d9f9b68d5614" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "registered_numbers" DROP CONSTRAINT "FK_42c592cb1b563d1d9f9b68d5614"`);
        await queryRunner.query(`DROP TABLE "registered_numbers"`);
    }

}

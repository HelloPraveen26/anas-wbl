import { MigrationInterface, QueryRunner } from "typeorm";

export class AddLivekitInboundTrunkIdToRegisteredNumbers1761320000000 implements MigrationInterface {
    name = 'AddLivekitInboundTrunkIdToRegisteredNumbers1761320000000'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "registered_numbers" ADD "livekit_inbound_trunk_id" character varying(255)`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "registered_numbers" DROP COLUMN "livekit_inbound_trunk_id"`);
    }

}

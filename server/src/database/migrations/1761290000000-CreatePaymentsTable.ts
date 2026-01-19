import { MigrationInterface, QueryRunner } from "typeorm";

export class CreatePaymentsTable1761290000000 implements MigrationInterface {
  name = "CreatePaymentsTable1761290000000";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE "payments" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "mihpayid" character varying,
        "status" character varying,
        "txnid" character varying,
        "amount" character varying,
        "udf1" character varying,
        "udf2" character varying,
        "udf3" character varying,
        "udf4" character varying,
        "udf5" character varying,
        "udf6" character varying,
        "udf7" character varying,
        "udf8" character varying,
        "udf9" character varying,
        "udf10" character varying,
        "hash" character varying NOT NULL,
        "field1" character varying,
        "field2" character varying,
        "field3" character varying,
        "field4" character varying,
        "field5" character varying,
        "field6" character varying,
        "field7" character varying,
        "field8" character varying,
        "field9" character varying,
        "payment_source" character varying,
        "bank_ref_num" character varying,
        "bankcode" character varying,
        "error" character varying,
        "error_message" character varying,
        "cardnum" character varying,
        "user_id" uuid NOT NULL,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_payments" PRIMARY KEY ("id")
      )
    `);

    await queryRunner.query(`
      ALTER TABLE "payments"
      ADD CONSTRAINT "FK_payments_user_id"
      FOREIGN KEY ("user_id")
      REFERENCES "users"("id")
      ON DELETE CASCADE ON UPDATE NO ACTION
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_payments_user_id" ON "payments" ("user_id")
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_payments_txnid" ON "payments" ("txnid")
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_payments_status" ON "payments" ("status")
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX "IDX_payments_status"`);
    await queryRunner.query(`DROP INDEX "IDX_payments_txnid"`);
    await queryRunner.query(`DROP INDEX "IDX_payments_user_id"`);
    await queryRunner.query(
      `ALTER TABLE "payments" DROP CONSTRAINT "FK_payments_user_id"`,
    );
    await queryRunner.query(`DROP TABLE "payments"`);
  }
}

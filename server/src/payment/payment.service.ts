import {
  Injectable,
  Logger,
  BadRequestException,
  InternalServerErrorException,
  NotFoundException,
} from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { UsersService } from "../users/users.service";
import { CreatePaymentDto } from "./dto/create-payment.dto";
import { PaymentInitiationResponseDto } from "./dto/payment-response.dto";
import { Payment } from "./entities/payment.entity";
import { User } from "../users/entities/user.entity";
import * as crypto from "crypto";

@Injectable()
export class PaymentService {
  private readonly logger = new Logger(PaymentService.name);

  constructor(
    private readonly configService: ConfigService,
    private readonly usersService: UsersService,
    @InjectRepository(Payment)
    private readonly paymentRepository: Repository<Payment>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  async createPayment(
    userId: string,
    createPaymentDto: CreatePaymentDto,
  ): Promise<PaymentInitiationResponseDto> {
    try {
      this.logger.log(
        `Creating payment for user ${userId}, amount: ${createPaymentDto.amount}`,
      );

      const key = this.configService.get<string>("PAYU_KEY");
      const salt = this.configService.get<string>("PAYU_SALT");

      if (!key || !salt) {
        throw new Error(
          "PayU credentials not configured. Set PAYU_KEY and PAYU_SALT environment variables.",
        );
      }

      const isTestEnv =
        (
          this.configService.get<string>("PAYU_TEST_MODE") || "true"
        ).toLowerCase() === "true";
      const testPaymentUrl =
        this.configService.get<string>("TEST_PAYMENT_URL") ||
        "https://test.payu.in/_payment";
      const prodPaymentUrl =
        this.configService.get<string>("PROD_PAYMENT_URL") ||
        "https://secure.payu.in/_payment";
      const paymentUrl = isTestEnv ? testPaymentUrl : prodPaymentUrl;

      const user = await this.usersService.findById(userId);

      const productinfo = "zenvoice";
      const amount = createPaymentDto.amount.toString();
      const firstname = user.firstName || "User";
      const email = user.email;
      const phone = user.phone || "";

      if (!productinfo || !amount || !firstname || !email) {
        throw new BadRequestException(
          "Missing required user fields (firstName, email are required)",
        );
      }

      const txnid = "txn" + Date.now();

      const baseUrl = this.configService.get<string>("APP_BASE_URL");
      const surl = `${baseUrl}/api/v1/payment/success`;
      const furl = `${baseUrl}/api/v1/payment/failure`;

      const params = {
        key,
        txnid,
        amount,
        productinfo,
        firstname,
        email,
        phone,
        surl,
        furl,
        udf1: createPaymentDto.reference || "", // Optional - can be used for order reference
      };

      const hash = this.generatePayuHash(params, salt);
      const formData = { ...params, hash };

      // Save payment record to database
      const payment = this.paymentRepository.create({
        txnid,
        amount,
        hash,
        userId,
      });
      await this.paymentRepository.save(payment);

      this.logger.log(`Payment initiated successfully with txnid: ${txnid}`);

      return new PaymentInitiationResponseDto({
        success: true,
        message: "Payment initiated",
        txnid,
        paymentUrl,
        formData,
      });
    } catch (error) {
      this.logger.error(`PayU payment error: ${error.message}`, error.stack);

      if (error instanceof BadRequestException) {
        throw error;
      }

      throw new InternalServerErrorException(
        `Payment initiation failed: ${error.message}`,
      );
    }
  }

  async handlePaymentSuccess(body: any): Promise<string> {
    this.logger.log("Payment success callback received");
    this.logger.log("Success callback body:", JSON.stringify(body, null, 2));

    try {
      // Verify hash
      const isValidHash = this.verifyPayUResponseHash(body);
      if (!isValidHash) {
        this.logger.error("Invalid hash in payment success response");
        throw new BadRequestException("Invalid hash in payment response");
      }

      // Find existing payment by hash
      const existingPayment = await this.paymentRepository.findOne({
        where: { hash: body.hash },
        relations: ["user"],
      });

      if (!existingPayment) {
        this.logger.error(`Payment not found for hash: ${body.hash}`);
        throw new NotFoundException("Payment record not found");
      }

      // Update payment record with PayU response data
      await this.paymentRepository.update(
        { id: existingPayment.id },
        {
          mihpayid: body.mihpayid,
          status: body.status,
          txnid: body.txnid,
          udf1: body.udf1,
          udf2: body.udf2,
          udf3: body.udf3,
          udf4: body.udf4,
          udf5: body.udf5,
          udf6: body.udf6,
          udf7: body.udf7,
          udf8: body.udf8,
          udf9: body.udf9,
          udf10: body.udf10,
          field1: body.field1,
          field2: body.field2,
          field3: body.field3,
          field4: body.field4,
          field5: body.field5,
          field6: body.field6,
          field7: body.field7,
          field8: body.field8,
          field9: body.field9,
          paymentSource: body.payment_source,
          bankRefNum: body.bank_ref_num,
          bankcode: body.bankcode,
          error: body.error,
          errorMessage: body.error_Message,
        },
      );

      // Update user credits if payment is successful
      if (body.status === "success") {
        const creditAmount = parseFloat(body.amount || "0");
        if (creditAmount > 0) {
          await this.userRepository.increment(
            { id: existingPayment.userId },
            "credits",
            creditAmount,
          );
          this.logger.log(
            `Added ${creditAmount} credits to user ${existingPayment.userId}`,
          );
        }
      }

      this.logger.log(`Payment ${body.txnid} processed successfully`);

      // Return redirect URL
      const appBaseUrl = this.configService.get<string>("APP_BASE_URL");
      return `${appBaseUrl}/dashboard/assistants`;
    } catch (error) {
      this.logger.error(
        `Payment success processing error: ${error.message}`,
        error.stack,
      );
      throw error;
    }
  }

  async handlePaymentFailure(body: any): Promise<string> {
    this.logger.log("Payment failure callback received");
    this.logger.log("Failure callback body:", JSON.stringify(body, null, 2));

    try {
      // Verify hash
      const isValidHash = this.verifyPayUResponseHash(body);
      if (!isValidHash) {
        this.logger.error("Invalid hash in payment failure response");
        throw new BadRequestException("Invalid hash in payment response");
      }

      // Find existing payment by hash
      const existingPayment = await this.paymentRepository.findOne({
        where: { hash: body.hash },
        relations: ["user"],
      });

      if (!existingPayment) {
        this.logger.error(`Payment not found for hash: ${body.hash}`);
        throw new NotFoundException("Payment record not found");
      }

      // Update payment record with PayU response data
      await this.paymentRepository.update(
        { id: existingPayment.id },
        {
          mihpayid: body.mihpayid,
          status: body.status,
          txnid: body.txnid,
          udf1: body.udf1,
          udf2: body.udf2,
          udf3: body.udf3,
          udf4: body.udf4,
          udf5: body.udf5,
          udf6: body.udf6,
          udf7: body.udf7,
          udf8: body.udf8,
          udf9: body.udf9,
          udf10: body.udf10,
          field1: body.field1,
          field2: body.field2,
          field3: body.field3,
          field4: body.field4,
          field5: body.field5,
          field6: body.field6,
          field7: body.field7,
          field8: body.field8,
          field9: body.field9,
          paymentSource: body.payment_source,
          bankRefNum: body.bank_ref_num,
          bankcode: body.bankcode,
          error: body.error,
          errorMessage: body.error_Message,
        },
      );

      this.logger.log(`Payment failure ${body.txnid} processed`);

      // Return redirect URL
      const appBaseUrl = this.configService.get<string>("APP_BASE_URL");
      return `${appBaseUrl}/dashboard/assistants`;
    } catch (error) {
      this.logger.error(
        `Payment failure processing error: ${error.message}`,
        error.stack,
      );
      throw error;
    }
  }

  async handlePaymentCancel(body: any): Promise<string> {
    this.logger.log("Payment cancel callback received");
    this.logger.log("Cancel callback body:", JSON.stringify(body, null, 2));

    // Return redirect URL for cancelled payments
    const appBaseUrl = this.configService.get<string>("APP_BASE_URL");
    return `${appBaseUrl}/dashboard/assistants`;
  }

  private generatePayuHash(params: any, salt: string): string {
    // PayU hash formula: key|txnid|amount|productinfo|firstname|email|udf1|udf2|udf3|udf4|udf5|udf6|udf7|udf8|udf9|udf10
    const hashString = [
      params.key,
      params.txnid,
      params.amount,
      params.productinfo,
      params.firstname,
      params.email,
      params.udf1 || "",
      "", // udf2
      "", // udf3
      "", // udf4
      "", // udf5
      "", // udf6
      "", // udf7
      "", // udf8
      "", // udf9
      "", // udf10
    ].join("|");

    const hashWithSalt = hashString + "|" + salt;
    const hash = crypto.createHash("sha512").update(hashWithSalt).digest("hex");

    this.logger.debug(`Hash string: ${hashString}`);
    this.logger.debug(`Generated hash: ${hash}`);

    return hash;
  }

  private verifyPayUResponseHash(body: any): boolean {
    try {
      const salt = this.configService.get<string>("PAYU_SALT");
      if (!salt) {
        this.logger.error("PAYU_SALT not configured");
        return false;
      }

      // PayU response hash formula: SALT|status|||||||||||||email|firstname|productinfo|amount|txnid|key
      const hashString = [
        salt,
        body.status || "",
        "",
        "",
        "",
        "",
        "",
        "",
        "",
        "",
        "",
        "",
        "",
        "", // 13 empty fields
        body.email || "",
        body.firstname || "",
        body.productinfo || "",
        body.amount || "",
        body.txnid || "",
        body.key || "",
      ].join("|");

      const expectedHash = crypto
        .createHash("sha512")
        .update(hashString)
        .digest("hex");

      this.logger.debug(`Response hash string: ${hashString}`);
      this.logger.debug(`Expected hash: ${expectedHash}`);
      this.logger.debug(`Received hash: ${body.hash}`);

      return expectedHash === body.hash;
    } catch (error) {
      this.logger.error(`Hash verification error: ${error.message}`);
      return false;
    }
  }
}

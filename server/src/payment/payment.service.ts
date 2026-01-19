import {
  Injectable,
  Logger,
  BadRequestException,
  InternalServerErrorException,
} from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { UsersService } from "../users/users.service";
import { CreatePaymentDto } from "./dto/create-payment.dto";
import { PaymentInitiationResponseDto } from "./dto/payment-response.dto";
import * as crypto from "crypto";

@Injectable()
export class PaymentService {
  private readonly logger = new Logger(PaymentService.name);

  constructor(
    private readonly configService: ConfigService,
    private readonly usersService: UsersService,
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

  async handlePaymentSuccess(body: any): Promise<void> {
    this.logger.log("Payment success callback received");
    this.logger.log("Success callback body:", JSON.stringify(body, null, 2));
  }

  async handlePaymentFailure(body: any): Promise<void> {
    this.logger.log("Payment failure callback received");
    this.logger.log("Failure callback body:", JSON.stringify(body, null, 2));
  }

  async handlePaymentCancel(body: any): Promise<void> {
    this.logger.log("Payment cancel callback received");
    this.logger.log("Cancel callback body:", JSON.stringify(body, null, 2));
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
}

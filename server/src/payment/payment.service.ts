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
const Razorpay = require('razorpay');

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
  ) { }

  async createPayment(
    userId: string,
    createPaymentDto: CreatePaymentDto,
  ): Promise<PaymentInitiationResponseDto> {
    try {
      this.logger.log(
        `Creating payment for user ${userId}, amount: ${createPaymentDto.amount}`,
      );

      const user = await this.usersService.findById(userId);
      const role = user.role;
      this.logger.log(`User role: ${role}`);

      // Block sub-users from exceeding admin's available credits
      if (role === 'user' && (user as any).adminId) {
        const baseAmount = createPaymentDto.baseAmount ?? createPaymentDto.amount;
        const costPerMinute = Number(user.costPerMinute) || 5.0;
        const requestedCredits = Math.floor(Number(baseAmount) / costPerMinute);
        const adminCredits = (user as any).adminCredits ?? 0;

        if (requestedCredits > adminCredits) {
          throw new BadRequestException(
            `Requested credits (${requestedCredits} min) exceed admin's available credits (${adminCredits} min). Please contact your admin.`,
          );
        }
      }


      if (role === 'admin') {
        const key_id = this.configService.get<string>("RAZORPAY_KEY_ID");
        const key_secret = this.configService.get<string>("RAZORPAY_KEY_SECRET");

        if (!key_id || !key_secret) {
          throw new Error("Razorpay credentials not configured.");
        }

        const amountInPaise = Math.round(Number(createPaymentDto.amount) * 100);

        const razorpay = new Razorpay({
          key_id,
          key_secret,
        });

        const options = {
          amount: amountInPaise,
          currency: "INR",
          receipt: `rcpt_${Date.now()}`,
          notes: {
            reference: createPaymentDto.reference || "",
            baseAmount: createPaymentDto.baseAmount?.toString() || "",
          }
        };

        const order = await razorpay.orders.create(options);

        const txnid = order.id;

        // Save payment record to database
        const payment = this.paymentRepository.create({
          txnid,
          amount: createPaymentDto.amount.toString(),
          hash: "razorpay_dummy_hash",
          userId,
          status: "created",
          udf1: options.notes.reference,
          udf2: options.notes.baseAmount,
        });
        await this.paymentRepository.save(payment);

        this.logger.log(`Payment initiated successfully with Razorpay order_id: ${txnid}`);

        return new PaymentInitiationResponseDto({
          success: true,
          message: "Payment initiated",
          txnid,
          paymentUrl: "",
          formData: {
            key: key_id,
            amount: amountInPaise.toString(),
            order_id: txnid,
            name: "Zenvoice",
            description: "Credits Top-up",
            prefill: {
              name: user.firstName || "User",
              email: user.email,
              contact: user.phone || "",
            }
          },
        });
      }

      // Regular/Sub-user flow uses PayU
      const key = this.configService.get<string>("PAYU_KEY");
      const salt = this.configService.get<string>("PAYU_SALT");

      if (!key || !salt) {
        throw new Error("PayU credentials not configured.");
      }

      const isTestMode = this.configService.get<string>("PAYU_TEST_MODE") === "true";
      const paymentUrl = isTestMode
        ? this.configService.get<string>("TEST_PAYMENT_URL") || "https://test.payu.in/_payment"
        : this.configService.get<string>("PROD_PAYMENT_URL") || "https://secure.payu.in/_payment";

      const txnid = `TXN${Date.now()}${Math.random().toString(36).substring(2, 7)}`;
      const backendUrl = this.configService.get<string>("BACKEND_URL") || "http://localhost:8000/api/v1";

      const params: any = {
        key,
        txnid,
        amount: createPaymentDto.amount.toString(),
        productinfo: "Credits Top-up",
        firstname: user.firstName || "User",
        email: user.email,
        phone: user.phone || "",
        surl: `${backendUrl}/payment/success`,
        furl: `${backendUrl}/payment/failure`,
        curl: `${backendUrl}/payment/cancel`,
        udf1: createPaymentDto.reference || "",
        udf2: (createPaymentDto.baseAmount ?? createPaymentDto.amount).toString(),
      };

      const hash = this.generatePayuHash(params, salt);
      params.hash = hash;

      // Save payment record to database
      const payment = this.paymentRepository.create({
        txnid,
        amount: createPaymentDto.amount.toString(),
        hash,
        userId,
        status: "pending",
        udf1: params.udf1,
        udf2: params.udf2,
      });
      await this.paymentRepository.save(payment);

      this.logger.log(`Payment initiated successfully with PayU txnid: ${txnid}`);

      return new PaymentInitiationResponseDto({
        success: true,
        message: "Payment initiated",
        txnid,
        paymentUrl,
        formData: params,
      });
    } catch (error) {
      this.logger.error(`Payment creation error: ${error.message}`, error.stack);

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
      // Find existing payment by txnid
      const existingPayment = await this.paymentRepository.findOne({
        where: { txnid: body.txnid },
        relations: ["user"],
      });

      if (!existingPayment) {
        this.logger.error(`Payment not found for txnid: ${body.txnid}`);
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
        // Prioritize base amount from udf2, fall back to total amount
        const rawAmount = body.udf2 || body.amount || "0";
        const creditAmount = parseFloat(rawAmount);

        if (creditAmount > 0) {
          await this.userRepository.increment(
            { id: existingPayment.userId },
            "credits",
            creditAmount,
          );
          this.logger.log(
            `Added ${creditAmount} credits to user ${existingPayment.userId} (based on ${body.udf2 ? 'udf2/baseAmount' : 'total amount'})`,
          );
        }
      }

      this.logger.log(`Payment ${body.txnid} processed successfully`);

      // Return redirect URL with success message
      const appBaseUrl = this.configService.get<string>("APP_BASE_URL");
      return `${appBaseUrl}/dashboard/assistants?payment=success`;
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

      // Return redirect URL with failure message
      const appBaseUrl = this.configService.get<string>("APP_BASE_URL");
      return `${appBaseUrl}/dashboard/assistants?payment=failed`;
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
    return `${appBaseUrl}/dashboard/assistants?payment=cancelled`;
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
      params.udf2 || "",
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

  async getPaymentHistory(userId: string): Promise<Payment[]> {
    return this.paymentRepository.find({
      where: { userId },
      order: { createdAt: "DESC" },
    });
  }

  async verifyRazorpayPayment(userId: string, body: { razorpay_order_id: string; razorpay_payment_id: string; razorpay_signature: string }): Promise<{ success: boolean; message: string }> {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = body;
    const key_secret = this.configService.get<string>("RAZORPAY_KEY_SECRET");
    
    if (!key_secret) {
      throw new InternalServerErrorException("Razorpay secret not configured");
    }

    const generated_signature = crypto.createHmac("sha256", key_secret)
      .update(razorpay_order_id + "|" + razorpay_payment_id)
      .digest("hex");

    if (generated_signature !== razorpay_signature) {
      throw new BadRequestException("Invalid payment signature");
    }

    const existingPayment = await this.paymentRepository.findOne({
      where: { txnid: razorpay_order_id, userId: userId },
    });

    if (!existingPayment) {
      throw new NotFoundException("Payment record not found");
    }

    if (existingPayment.status === "success") {
      return { success: true, message: "Payment already verified" };
    }

    await this.paymentRepository.update(
      { id: existingPayment.id },
      {
        status: "success",
        mihpayid: razorpay_payment_id,
        hash: razorpay_signature,
      }
    );

    const rawAmount = existingPayment.udf2 || existingPayment.amount || "0";
    const creditAmount = parseFloat(rawAmount);

    if (creditAmount > 0) {
      await this.userRepository.increment(
        { id: existingPayment.userId },
        "credits",
        creditAmount,
      );
      this.logger.log(`Added ${creditAmount} credits to user ${existingPayment.userId}`);
    }

    return { success: true, message: "Payment verified successfully" };
  }

}
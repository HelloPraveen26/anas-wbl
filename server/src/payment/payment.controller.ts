import {
  Controller,
  Post,
  Body,
  UseGuards,
  Request,
  HttpStatus,
  Res,
  Redirect,
} from "@nestjs/common";
import { Response } from "express";
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiBody,
} from "@nestjs/swagger";
import { ThrottlerGuard } from "@nestjs/throttler";
import { ConfigService } from "@nestjs/config";
import { PaymentService } from "./payment.service";
import {
  CreatePaymentDto,
  PaymentInitiationResponseDto,
  PaymentCallbackResponseDto,
} from "./dto";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";

@ApiTags("payment")
@Controller("payment")
@UseGuards(ThrottlerGuard)
export class PaymentController {
  constructor(
    private readonly paymentService: PaymentService,
    private readonly configService: ConfigService,
  ) {}

  @Post("create-payment")
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth("JWT-auth")
  @ApiOperation({
    summary: "Create PayU payment",
    description: "Initiate a new payment transaction using PayU gateway",
  })
  @ApiBody({ type: CreatePaymentDto })
  @ApiResponse({
    status: HttpStatus.OK,
    description: "Payment initiated successfully",
    type: PaymentInitiationResponseDto,
    example: {
      success: true,
      message: "Payment initiated",
      txnid: "txn1704067200000",
      paymentUrl: "https://test.payu.in/_payment",
      formData: {
        key: "merchant_key",
        txnid: "txn1704067200000",
        amount: "100.50",
        productinfo: "zenvoice",
        firstname: "John",
        email: "john@example.com",
        phone: "+1234567890",
        surl: "https://yourapp.com/payment/success",
        furl: "https://yourapp.com/payment/failure",
        hash: "generated_hash_value",
        udf1: "ORDER-123456",
      },
    },
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: "Bad request - validation failed or missing user data",
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: "Unauthorized - invalid token",
  })
  @ApiResponse({
    status: HttpStatus.INTERNAL_SERVER_ERROR,
    description:
      "Internal server error - PayU configuration or payment initiation failed",
  })
  async createPayment(
    @Request() req,
    @Body() createPaymentDto: CreatePaymentDto,
  ): Promise<PaymentInitiationResponseDto> {
    return this.paymentService.createPayment(req.user.id, createPaymentDto);
  }

  @Post("success")
  async handlePaymentSuccess(
    @Body() body: any,
    @Res() res: Response,
  ): Promise<void> {
    try {
      const redirectUrl = await this.paymentService.handlePaymentSuccess(body);
      res.redirect(redirectUrl);
    } catch (error) {
      // On error, redirect to dashboard with error parameter
      const baseUrl = this.configService.get<string>("APP_BASE_URL");
      res.redirect(`${baseUrl}/dashboard/assistants?payment=error`);
    }
  }

  @Post("failure")
  async handlePaymentFailure(
    @Body() body: any,
    @Res() res: Response,
  ): Promise<void> {
    try {
      const redirectUrl = await this.paymentService.handlePaymentFailure(body);
      res.redirect(`${redirectUrl}?payment=failed`);
    } catch (error) {
      // On error, redirect to dashboard with error parameter
      const baseUrl = this.configService.get<string>("APP_BASE_URL");
      res.redirect(`${baseUrl}/dashboard/assistants?payment=error`);
    }
  }

  @Post("cancel")
  async handlePaymentCancel(
    @Body() body: any,
    @Res() res: Response,
  ): Promise<void> {
    try {
      const redirectUrl = await this.paymentService.handlePaymentCancel(body);
      res.redirect(`${redirectUrl}?payment=cancelled`);
    } catch (error) {
      const baseUrl = this.configService.get<string>("APP_BASE_URL");
      res.redirect(`${baseUrl}/dashboard/assistants?payment=error`);
    }
  }
}

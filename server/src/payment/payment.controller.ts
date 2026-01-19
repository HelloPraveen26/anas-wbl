import {
  Controller,
  Post,
  Body,
  UseGuards,
  Request,
  HttpStatus,
} from "@nestjs/common";
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiBody,
} from "@nestjs/swagger";
import { ThrottlerGuard } from "@nestjs/throttler";
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
  constructor(private readonly paymentService: PaymentService) {}

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
  ): Promise<PaymentCallbackResponseDto> {
    await this.paymentService.handlePaymentSuccess(body);
    return new PaymentCallbackResponseDto(
      true,
      "Payment success callback processed",
    );
  }

  @Post("failure")
  async handlePaymentFailure(
    @Body() body: any,
  ): Promise<PaymentCallbackResponseDto> {
    await this.paymentService.handlePaymentFailure(body);
    return new PaymentCallbackResponseDto(
      true,
      "Payment failure callback processed",
    );
  }

  @Post("cancel")
  async handlePaymentCancel(
    @Body() body: any,
  ): Promise<PaymentCallbackResponseDto> {
    await this.paymentService.handlePaymentCancel(body);
    return new PaymentCallbackResponseDto(
      true,
      "Payment cancel callback processed",
    );
  }
}

import { ApiProperty } from '@nestjs/swagger';

export class PaymentInitiationResponseDto {
  @ApiProperty({
    description: 'Whether the payment initiation was successful',
    example: true,
  })
  success: boolean;

  @ApiProperty({
    description: 'Response message',
    example: 'Payment initiated',
  })
  message: string;

  @ApiProperty({
    description: 'Unique transaction ID',
    example: 'txn1704067200000',
  })
  txnid: string;

  @ApiProperty({
    description: 'PayU payment URL',
    example: 'https://test.payu.in/_payment',
  })
  paymentUrl: string;

  @ApiProperty({
    description: 'Form data to be sent to PayU',
    example: {
      key: 'merchant_key',
      txnid: 'txn1704067200000',
      amount: '100.50',
      productinfo: 'zenvoice',
      firstname: 'John',
      email: 'john@example.com',
      phone: '+1234567890',
      surl: 'https://yourapp.com/payment/success',
      furl: 'https://yourapp.com/payment/failure',
      hash: 'generated_hash_value',
      udf1: 'ORDER-123456'
    },
  })
  formData: Record<string, any>;

  constructor(data: {
    success: boolean;
    message: string;
    txnid: string;
    paymentUrl: string;
    formData: Record<string, any>;
  }) {
    this.success = data.success;
    this.message = data.message;
    this.txnid = data.txnid;
    this.paymentUrl = data.paymentUrl;
    this.formData = data.formData;
  }
}

export class PaymentCallbackResponseDto {
  @ApiProperty({
    description: 'Whether the callback was processed successfully',
    example: true,
  })
  success: boolean;

  @ApiProperty({
    description: 'Response message',
    example: 'Payment callback processed',
  })
  message: string;

  constructor(success: boolean, message: string) {
    this.success = success;
    this.message = message;
  }
}

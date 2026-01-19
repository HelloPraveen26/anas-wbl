import { ApiProperty } from '@nestjs/swagger';
import { IsNumber, IsOptional, IsString, Min } from 'class-validator';

export class CreatePaymentDto {
  @ApiProperty({
    description: 'Payment amount',
    example: 100.50,
    minimum: 0.01,
  })
  @IsNumber({}, { message: 'Amount must be a valid number' })
  @Min(0.01, { message: 'Amount must be greater than 0' })
  amount: number;

  @ApiProperty({
    description: 'Optional reference for the payment',
    example: 'ORDER-123456',
    required: false,
  })
  @IsOptional()
  @IsString({ message: 'Reference must be a string' })
  reference?: string;
}

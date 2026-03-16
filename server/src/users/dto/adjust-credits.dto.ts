import { ApiProperty } from '@nestjs/swagger';
import { IsNumber, IsEnum, IsString, IsOptional, Min } from 'class-validator';
import { Type } from 'class-transformer';

export enum AdjustmentAction {
    ADD = 'add',
    DEDUCT = 'deduct',
}

export class AdjustCreditsDto {
    @ApiProperty({
        description: 'Amount (in ₹ for ADD, in Units for DEDUCT)',
        example: 100,
    })
    @IsNumber()
    @Min(0.01)
    @Type(() => Number)
    amount: number;

    @ApiProperty({
        description: 'Action to perform (add or deduct)',
        enum: AdjustmentAction,
        example: 'add',
    })
    @IsEnum(AdjustmentAction)
    action: AdjustmentAction;

    @ApiProperty({
        description: 'Optional description for the adjustment',
        example: 'Top-up for marketing campaign',
        required: false,
    })
    @IsString()
    @IsOptional()
    description?: string;
}

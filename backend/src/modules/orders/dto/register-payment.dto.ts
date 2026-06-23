import { IsEnum, IsNumber, IsOptional, IsPositive, IsString, Min } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class RegisterPaymentDto {
  @ApiProperty({ enum: ['cash_usd', 'cash_ves', 'card', 'transfer', 'pago_movil', 'online'] })
  @IsEnum(['cash_usd', 'cash_ves', 'card', 'transfer', 'pago_movil', 'online'])
  method: 'cash_usd' | 'cash_ves' | 'card' | 'transfer' | 'pago_movil' | 'online';

  @ApiProperty({ example: 10.5 })
  @IsNumber()
  @IsPositive()
  amount: number;

  @ApiPropertyOptional({ example: 'REF12345' })
  @IsString()
  @IsOptional()
  reference?: string;

  @ApiPropertyOptional({ example: 2.0 })
  @IsNumber()
  @Min(0)
  @IsOptional()
  tip?: number;
}


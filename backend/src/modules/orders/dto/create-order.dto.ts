import { Type } from 'class-transformer';
import { IsArray, IsBoolean, IsEnum, IsInt, IsNumber, IsOptional, IsPositive, IsString, Min, ValidateNested } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class OrderItemInputDto {
  @ApiPropertyOptional({ example: 1 })
  @IsNumber()
  @IsOptional()
  productId?: number;

  @ApiPropertyOptional({ example: [1, 2] })
  @IsArray()
  @IsNumber({}, { each: true })
  @IsOptional()
  extraIds?: number[];

  @ApiPropertyOptional({ example: 1 })
  @IsNumber()
  @IsOptional()
  comboId?: number;

  @ApiProperty({ example: 1 })
  @IsInt()
  @IsPositive()
  quantity: number;

  @ApiProperty({ example: 10.5 })
  @IsNumber()
  @IsPositive()
  unitPrice: number;

  @ApiPropertyOptional({ example: 'Sin cebolla' })
  @IsString()
  @IsOptional()
  notes?: string;
}

export class CreateOrderDto {
  @ApiProperty({ enum: ['dine_in', 'takeaway', 'delivery', 'phone'] })
  @IsEnum(['dine_in', 'takeaway', 'delivery', 'phone'])
  type: 'dine_in' | 'takeaway' | 'delivery' | 'phone';

  @ApiPropertyOptional({ enum: ['pos', 'web', 'phone'], default: 'pos' })
  @IsEnum(['pos', 'web', 'phone'])
  @IsOptional()
  source?: 'pos' | 'web' | 'phone';

  @ApiPropertyOptional({ example: 1 })
  @IsNumber()
  @IsOptional()
  tableId?: number;

  @ApiPropertyOptional({ example: 1 })
  @IsNumber()
  @IsOptional()
  customerId?: number;

  @ApiPropertyOptional({ example: 1 })
  @IsNumber()
  @IsOptional()
  deliveryAddressId?: number;

  @ApiPropertyOptional({ example: 'Entregar en portería' })
  @IsString()
  @IsOptional()
  deliveryNotes?: string;

  @ApiPropertyOptional({ example: 0 })
  @IsNumber()
  @Min(0)
  @IsOptional()
  discount?: number;

  @ApiPropertyOptional({ example: false })
  @IsBoolean()
  @IsOptional()
  paid?: boolean;

  @ApiPropertyOptional({ example: 0 })
  @IsNumber()
  @Min(0)
  @IsOptional()
  tip?: number;

  @ApiProperty({ type: [OrderItemInputDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => OrderItemInputDto)
  items: OrderItemInputDto[];
}

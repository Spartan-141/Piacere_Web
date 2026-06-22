import { Type } from 'class-transformer';
import { IsArray, IsBoolean, IsNotEmpty, IsNumber, IsOptional, IsPositive, IsString, Min, MinLength, ValidateNested } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class ComboItemDto {
  @ApiProperty({ example: 1 })
  @IsNumber()
  productId: number;

  @ApiProperty({ example: 1 })
  @IsNumber()
  @Min(1)
  quantity: number;
}

export class CreateComboDto {
  @ApiProperty({ example: 'Combo Familiar' })
  @IsString()
  @MinLength(2)
  name: string;

  @ApiPropertyOptional({ example: 'Descripción del combo' })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiProperty({ example: 18.0 })
  @IsNumber()
  @IsPositive()
  price: number;

  @ApiPropertyOptional({ example: true })
  @IsBoolean()
  @IsOptional()
  isOnWebMenu?: boolean;

  @ApiProperty({ type: [ComboItemDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ComboItemDto)
  @IsNotEmpty()
  items: ComboItemDto[];
}

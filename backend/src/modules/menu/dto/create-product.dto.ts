import { IsBoolean, IsNotEmpty, IsNumber, IsOptional, IsPositive, IsString, MinLength } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';

export class CreateProductDto {
  @ApiProperty({ example: 1 })
  @IsNumber()
  categoryId: number;

  @ApiProperty({ example: 'Margarita' })
  @IsString()
  @MinLength(2)
  name: string;

  @ApiPropertyOptional({ example: 'Salsa napolitana | mozzarella | albahaca.' })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiProperty({ example: 7.0 })
  @IsNumber()
  @IsPositive()
  basePrice: number;

  @ApiPropertyOptional({ example: true })
  @IsBoolean()
  @IsOptional()
  @Transform(({ value }) => value ?? true)
  isOnWebMenu?: boolean;

  @ApiPropertyOptional({ example: 'https://example.com/pizza.jpg' })
  @IsString()
  @IsOptional()
  imageUrl?: string;
}

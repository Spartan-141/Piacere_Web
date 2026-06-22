import { IsBoolean, IsNumber, IsOptional, IsPositive, IsString, MinLength } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateProductDto {
  @ApiPropertyOptional({ example: 1 })
  @IsNumber()
  @IsOptional()
  categoryId?: number;

  @ApiPropertyOptional({ example: 'Margarita' })
  @IsString()
  @MinLength(2)
  @IsOptional()
  name?: string;

  @ApiPropertyOptional({ example: 'Salsa napolitana | mozzarella | albahaca.' })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiPropertyOptional({ example: 7.0 })
  @IsNumber()
  @IsPositive()
  @IsOptional()
  basePrice?: number;

  @ApiPropertyOptional({ example: true })
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;

  @ApiPropertyOptional({ example: true })
  @IsBoolean()
  @IsOptional()
  isOnWebMenu?: boolean;

  @ApiPropertyOptional({ example: 'https://example.com/pizza.jpg' })
  @IsString()
  @IsOptional()
  imageUrl?: string;
}

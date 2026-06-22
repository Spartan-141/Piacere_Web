import { IsBoolean, IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';

export class CreateCategoryDto {
  @ApiProperty({ example: 'Pizzas' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({ example: 'pizzas' })
  @IsString()
  @IsNotEmpty()
  slug: string;

  @ApiPropertyOptional({ example: true })
  @IsBoolean()
  @IsOptional()
  @Transform(({ value }) => value ?? true)
  isVisibleOnWeb?: boolean;

  @ApiPropertyOptional({ example: 0 })
  @IsOptional()
  sortOrder?: number;
}

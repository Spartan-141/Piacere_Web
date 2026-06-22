import { IsNumber, IsOptional, IsPositive } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateTableDto {
  @ApiPropertyOptional({ example: 4 })
  @IsNumber()
  @IsPositive()
  @IsOptional()
  capacity?: number;

  @ApiProperty({ example: 1 })
  @IsNumber()
  sectionId: number;
}

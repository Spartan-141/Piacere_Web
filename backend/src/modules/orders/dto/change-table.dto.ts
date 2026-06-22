import { IsNumber, IsOptional } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class ChangeTableDto {
  @ApiPropertyOptional({ example: 1 })
  @IsNumber()
  @IsOptional()
  tableId?: number | null;
}

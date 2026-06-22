import { IsEnum } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class ChangeTypeDto {
  @ApiProperty({ enum: ['dine_in', 'takeaway', 'delivery', 'phone'] })
  @IsEnum(['dine_in', 'takeaway', 'delivery', 'phone'])
  type: 'dine_in' | 'takeaway' | 'delivery' | 'phone';
}

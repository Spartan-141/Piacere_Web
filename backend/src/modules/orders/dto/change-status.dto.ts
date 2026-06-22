import { IsEnum } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class ChangeStatusDto {
  @ApiProperty({ enum: ['pending', 'confirmed', 'preparing', 'ready', 'delivered', 'cancelled'] })
  @IsEnum(['pending', 'confirmed', 'preparing', 'ready', 'delivered', 'cancelled'])
  status: 'pending' | 'confirmed' | 'preparing' | 'ready' | 'delivered' | 'cancelled';
}

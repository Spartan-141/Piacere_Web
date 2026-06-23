import { IsEnum } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class ChangeStatusDto {
  @ApiProperty({ enum: ['pending', 'confirmed', 'preparing', 'ready', 'served', 'delivered', 'cancelled'] })
  @IsEnum(['pending', 'confirmed', 'preparing', 'ready', 'served', 'delivered', 'cancelled'])
  status: 'pending' | 'confirmed' | 'preparing' | 'ready' | 'served' | 'delivered' | 'cancelled';
}


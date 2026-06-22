import { IsNumber, IsString, Min, MinLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateExtraDto {
  @ApiProperty({ example: 'Hot honey' })
  @IsString()
  @MinLength(2)
  name: string;

  @ApiProperty({ example: 1.5 })
  @IsNumber()
  @Min(0)
  price: number;
}


import { IsNotEmpty, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateSectionDto {
  @ApiProperty({ example: 'Terraza' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({ example: 'T' })
  @IsString()
  @IsNotEmpty()
  prefix: string;
}

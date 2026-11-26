import { ApiProperty } from '@nestjs/swagger';
import { IsNumber, Max, Min } from 'class-validator';

export class UpdateProgressDto {
  @ApiProperty({ minimum: 0, maximum: 100, example: 100 })
  @IsNumber()
  @Min(0)
  @Max(100)
  completionPercentage: number;
}

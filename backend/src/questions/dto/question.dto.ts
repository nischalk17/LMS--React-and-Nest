import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, MaxLength } from 'class-validator';

export class CreateQuestionDto {
  @ApiProperty({ example: 'How do generics differ from any?' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(2000)
  body: string;
}

export class AnswerQuestionDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  @MaxLength(4000)
  answer: string;
}

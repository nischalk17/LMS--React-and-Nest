import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';
import {
  ArrayMaxSize,
  ArrayMinSize,
  IsArray,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  Max,
  MaxLength,
  Min,
  ValidateNested,
} from 'class-validator';

export class QuizQuestionDto {
  @ApiPropertyOptional({
    description:
      'Id of an existing question; keeps its answer history when editing',
  })
  @IsOptional()
  @IsUUID()
  id?: string;

  @ApiProperty({ example: 'What does DTO stand for?' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(500)
  text: string;

  @ApiProperty({ example: ['Data Transfer Object', 'Direct Table Output'] })
  @IsArray()
  @ArrayMinSize(2)
  @ArrayMaxSize(6)
  @IsString({ each: true })
  @IsNotEmpty({ each: true })
  @MaxLength(300, { each: true })
  options: string[];

  @ApiProperty({ description: 'Index of the right option', example: 0 })
  @IsInt()
  @Min(0)
  correctIndex: number;

  @ApiPropertyOptional({
    example: 'Generics',
    description: 'Topic this question tests (defaults to the course title)',
  })
  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? value.trim() || undefined : value,
  )
  @IsOptional()
  @IsString()
  @MaxLength(80)
  skill?: string;
}

export class UpsertQuizDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  title: string;

  @ApiProperty({ minimum: 0, maximum: 100, example: 70 })
  @IsInt()
  @Min(0)
  @Max(100)
  passingScore: number;

  @ApiProperty({ type: [QuizQuestionDto] })
  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(50)
  @ValidateNested({ each: true })
  @Type(() => QuizQuestionDto)
  questions: QuizQuestionDto[];
}

export class SubmitAttemptDto {
  @ApiProperty({ description: 'Chosen option index per question, in order' })
  @IsArray()
  @ArrayMaxSize(50)
  @IsInt({ each: true })
  @Min(0, { each: true })
  answers: number[];
}

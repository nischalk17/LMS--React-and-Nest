import { Transform } from 'class-transformer';
import {
  IsUrl,
  MaxLength,
  IsString,
  IsNotEmpty,
  IsEnum,
  IsOptional,
  IsNumber,
} from 'class-validator';
import { ModuleType } from '../../entities/module.entity';

export class CreateModuleDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  title: string;

  @IsString()
  @IsOptional()
  content?: string;

  @IsEnum(ModuleType)
  type: ModuleType;

  @Transform(({ value }: { value: unknown }) => (value === '' ? null : value))
  @IsOptional()
  @IsUrl({ protocols: ['http', 'https'], require_protocol: true })
  videoUrl?: string;

  @Transform(({ value }: { value: unknown }) => (value === '' ? null : value))
  @IsOptional()
  @IsUrl({ protocols: ['http', 'https'], require_protocol: true })
  pdfUrl?: string;

  @IsNumber()
  @IsOptional()
  order?: number;
}

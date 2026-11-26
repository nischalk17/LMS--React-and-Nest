import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsEmail,
  IsString,
  MinLength,
  IsIn,
  IsOptional,
  IsNotEmpty,
} from 'class-validator';
import { UserRole } from '../../entities/user.entity';

export class RegisterDto {
  @ApiProperty({ example: 'jane@example.com' })
  @IsEmail()
  email: string;

  @ApiProperty({ minLength: 6 })
  @IsString()
  @MinLength(6)
  password: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  firstName: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  lastName: string;

  @ApiPropertyOptional({
    enum: [UserRole.STUDENT, UserRole.INSTRUCTOR],
    default: UserRole.STUDENT,
  })
  @IsIn([UserRole.STUDENT, UserRole.INSTRUCTOR])
  @IsOptional()
  role?: UserRole;
}

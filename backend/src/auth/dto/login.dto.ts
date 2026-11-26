import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsString } from 'class-validator';

export class LoginDto {
  @ApiProperty({ example: 'student@lms.dev' })
  @IsEmail()
  email: string;

  @ApiProperty()
  @IsString()
  password: string;
}

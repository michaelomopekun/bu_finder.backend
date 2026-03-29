import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty, IsString } from 'class-validator';
import { responseStatus } from 'src/db/schema/enums';

export class LoginDto {
  @IsEmail()
  @ApiProperty({ example: 'john.doe@babcock.edu.ng', description: 'Babcock University email' })
  email: string;

  @IsString()
  @IsNotEmpty()
  @ApiProperty({ example: 'password123', description: 'User password' })
  password: string;
}

export class LoginResponseDto {
  @ApiProperty({ example: responseStatus.SUCCESS, description: 'Response status' })
  status: responseStatus;

  @ApiProperty({ example: 'Login successful', description: 'Response message' })
  message: string;

  @ApiProperty({ example: { accessToken: 'ey...jwt.token.here' }, description: 'Data containing the JWT access token' })
  data: {
    accessToken: string;
  }
}

export class ResetPasswordDto {
  @IsString()
  @IsNotEmpty()
  @ApiProperty({ example: 'password123', description: 'User password' })
  currenPassword: string;

  @IsString()
  @IsNotEmpty()
  @ApiProperty({ example: 'password123', description: 'User password' })
  password: string;
}

export class ResetPasswordResponseDto {
  @ApiProperty({ example: responseStatus.SUCCESS, description: 'Response status' })
  status: responseStatus;

  @ApiProperty({ example: 'password reset successful', description: 'Response message' })
  message: string;
}
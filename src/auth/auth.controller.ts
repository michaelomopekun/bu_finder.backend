import {
  Controller,
  Post,
  Get,
  Body,
  UseGuards,
  HttpCode,
  HttpStatus,
  Inject,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { RegisterDto, LoginDto, LoginResponseDto, RegisterResponseDto } from './dto';
import { JwtAuthGuard } from './guards';
import { CurrentUser } from './decorators';
import { AUTH_SERVICE, type IAuthService } from './interfaces';
import { responseStatus } from 'src/db/schema';
import { GetProfileResponseDto } from './dto/user.dto';

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(
    @Inject(AUTH_SERVICE)
    private readonly authService: IAuthService
  ) {}

  @Post('register')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Register a new user' })
  @ApiResponse({ status: 201, description: 'Verification email sent', type: RegisterResponseDto })
  async register(@Body() dto: RegisterDto): Promise<RegisterResponseDto> {
    const result = await this.authService.register(dto);
    return {
      status: responseStatus.SUCCESS,
      message: 'verification email sent',
      data: {
        verified: result.emailVerified!,
      }
    };
  }

  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Login and get JWT token' })
  @ApiResponse({ status: 200, description: 'Login successful', type: LoginResponseDto })
  async login(@Body() dto: LoginDto): Promise<LoginResponseDto> {
    const result = await this.authService.login(dto);
    return {
      status: responseStatus.SUCCESS,
      message: 'Login successful',
      data: {
        accessToken: result.accessToken!,
      }
    };
  }  
  

  @Get('profile')
  @HttpCode(HttpStatus.OK)
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get current user profile' })
  @ApiResponse({ status: 200, description: 'Profile retrieved', type: GetProfileResponseDto })
  async getProfile(@CurrentUser('id') userId: string): Promise<GetProfileResponseDto> {
    return {
      status: responseStatus.SUCCESS,
      message: 'Profile retrieved successfully',
      data: await this.authService.getProfile(userId),
    };
  }

  @Post('admin-login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Login as an admin and get JWT token' })
  @ApiResponse({ status: 200, description: 'Admin login successful', type: LoginResponseDto })
  async adminLogin(@Body() dto: LoginDto): Promise<LoginResponseDto> {
    const result = await this.authService.adminLogin(dto);
    return {
      status: responseStatus.SUCCESS,
      message: 'Admin Login successful',
      data: {
        accessToken: result.accessToken!,
      }
    };
  }
}
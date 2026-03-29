import {
  Injectable,
  Inject,
  ConflictException,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { AUTH_REPOSITORY } from './interfaces';
import type { AuthResponse, IAuthRepository } from './interfaces';
import { RegisterDto, LoginDto, ResetPasswordDto, ResetPasswordResponseDto } from './dto';
import { IAuthService } from './interfaces/auth-service.interface';
import { responseStatus } from 'src/db/schema';

@Injectable()
export class AuthService implements IAuthService {
  constructor(
    @Inject(AUTH_REPOSITORY)
    private readonly authRepository: IAuthRepository,
    private readonly jwtService: JwtService,
  ) {}

  async resetPassword(userId: string, dto: ResetPasswordDto): Promise<ResetPasswordResponseDto> {
    const user = await this.authRepository.findById(userId);
    if (!user) {
      throw new UnauthorizedException('User not found');
    }
    // Compare current password    
    const isCurrentPasswordValid = await bcrypt.compare(dto.currenPassword, user.password);
    if (!isCurrentPasswordValid) {
      throw new UnauthorizedException('Invalid current password');
    }

    // Hash new password
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(dto.password, saltRounds);

    // Update password
    await this.authRepository.update(userId, { password: hashedPassword });

    return {
      status: responseStatus.SUCCESS,
      message: 'Password reset successfully',
    };
  }

  async register(dto: RegisterDto): Promise<AuthResponse> {
    // Check if email already exists
    const existingEmail = await this.authRepository.findByEmail(dto.email);
    if (existingEmail) {
      throw new ConflictException('Email already registered');
    }

    // Check if university ID already exists
    const existingUniversityId = await this.authRepository.findByUniversityId(
      dto.universityId,
    );
    if (existingUniversityId) {
      throw new ConflictException('University ID already registered');
    }

    // Hash password
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(dto.password, saltRounds);

    // Create user
    const newUser = await this.authRepository.create({
      fullName: dto.fullName,
      email: dto.email,
      universityId: dto.universityId,
      password: hashedPassword,
    });

    // // Generate token
    // const accessToken = this.generateToken(
    //   newUser.id,
    //   newUser.email,
    //   newUser.role,
    // );

    return {
      emailVerified: newUser.emailVerified,
    };
  }

  async login(dto: LoginDto) {
    // Find user by email
    const user = await this.authRepository.findByEmail(dto.email);
    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    // Check role
    if( user.role !== "STUDENT") {
      throw new UnauthorizedException("Invalid credentials")
    }

    // Compare password
    const isPasswordValid = await bcrypt.compare(dto.password, user.password);
    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    // Generate token
    const accessToken = this.generateToken(user.id, user.email, user.role);

    return {
        accessToken,
    };
  }

  async adminLogin(dto: LoginDto) {

    
    // Find user by email
    const user = await this.authRepository.findByEmail(dto.email);
    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    // validate role
    if(user.role !== 'ADMIN'){
      throw new UnauthorizedException('Invalid credentials')
    }

    // Compare password
    const isPasswordValid = await bcrypt.compare(dto.password, user.password);
    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    // Generate token
    const accessToken = this.generateToken(user.id, user.email, user.role);

    return {
        accessToken,
    };
  }

  async getProfile(userId: string) {
    const user = await this.authRepository.findById(userId);
    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    return user;
  }

  private generateToken(userId: string, email: string, role: string): string {
    const payload = { sub: userId, email, role };
    return this.jwtService.sign(payload);
  }
}
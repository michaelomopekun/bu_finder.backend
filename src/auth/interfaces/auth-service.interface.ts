import { RegisterDto, LoginDto } from '../dto';
import { UserResult } from './auth-repository.interface';

export interface AuthResponse {
    accessToken?: string;
    emailVerified?: boolean;
}

export const AUTH_SERVICE = Symbol('AUTH_SERVICE');

export interface IAuthService {
  register(dto: RegisterDto): Promise<AuthResponse>;
  login(dto: LoginDto): Promise<AuthResponse>;
  adminLogin(dto: LoginDto): Promise<AuthResponse>;
  getProfile(userId: string): Promise<UserResult>;
}
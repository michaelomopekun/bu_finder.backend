export interface CreateUserData {
  fullName: string;
  email: string;
  universityId: string;
  password: string;
}

export interface UserResult {
  id: string;
  fullName: string;
  email: string;
  universityId: string;
  role: string;
  createdAt: Date;
}

export interface UserWithPassword extends UserResult {
  password: string;
}

export interface UserEmailVerification {
  emailVerified: boolean;
}

export interface IAuthRepository {
    findByEmail(email: string): Promise<UserWithPassword | null>;
    findByUniversityId(universityId: string): Promise<UserResult | null>;
    findById(userId: string): Promise<UserWithPassword | null>;
    create(data: CreateUserData): Promise<UserEmailVerification>;
    update(userId: string, data: Partial<CreateUserData>): Promise<void>;
    updateEmailVerificationStatus(userId: string, emailVerified: boolean): Promise<void>;
}

export const AUTH_REPOSITORY = Symbol('AUTH_REPOSITORY');
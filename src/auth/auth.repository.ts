import { Injectable, Inject } from '@nestjs/common';
import { eq } from 'drizzle-orm';
import { NodePgDatabase } from 'drizzle-orm/node-postgres';
import { DRIZZLE } from '../db/db.module';
import * as schema from '../db/schema/index';
import { users } from '../db/schema/index';
import {
  IAuthRepository,
  CreateUserData,
  UserResult,
  UserWithPassword,
  UserEmailVerification,
} from './interfaces';
import passport from 'passport';

@Injectable()
export class AuthRepository implements IAuthRepository {
  constructor(
    @Inject(DRIZZLE)
    private readonly db: NodePgDatabase<typeof schema>,
  ) {}

  async update(userId: string, data: Partial<CreateUserData>): Promise<void> {
    await this.db
      .update(users)
      .set(data)
      .where(eq(users.id, userId))
      .then(() => {});
  }

  async updateEmailVerificationStatus(userId: string, emailVerified: boolean): Promise<void> {
    await this.db
      .update(users)
      .set({ emailVerified })
      .where(eq(users.id, userId));
  }

  async findByEmail(email: string): Promise<UserWithPassword | null> {
    const [user] = await this.db
      .select()
      .from(users)
      .where(eq(users.email, email))
      .limit(1);

    return user ?? null;
  }

  async findByUniversityId(universityId: string): Promise<UserResult | null> {
    const [user] = await this.db
      .select({
        id: users.id,
        fullName: users.fullName,
        email: users.email,
        universityId: users.universityId,
        role: users.role,
        createdAt: users.createdAt,
      })
      .from(users)
      .where(eq(users.universityId, universityId))
      .limit(1);

    return user ?? null;
  }

  async findById(userId: string): Promise<UserWithPassword | null> {
    const [user] = await this.db
      .select({
        id: users.id,
        fullName: users.fullName,
        email: users.email,
        universityId: users.universityId,
        role: users.role,
        password: users.password,
        createdAt: users.createdAt,
      })
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);

    return user ?? null;
  }

  async create(data: CreateUserData): Promise<UserEmailVerification> {
    const [newUser] = await this.db
      .insert(users)
      .values({
        fullName: data.fullName,
        email: data.email,
        universityId: data.universityId,
        password: data.password,
      })
      .returning({
        emailVerified: users.emailVerified,
      });

    return newUser;
  }
}
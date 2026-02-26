import { Injectable, Inject } from '@nestjs/common';
import { eq, desc, count } from 'drizzle-orm';
import { NodePgDatabase } from 'drizzle-orm/node-postgres';
import { DRIZZLE } from '../../db/db.module';
import * as schema from '../../db/schema';
import { notifications } from '../../db/schema';
import { INotificationsRepository, NotificationData, CreateNotificationData } from './interface/notifications-repository.interface';

@Injectable()
export class NotificationsRepository implements INotificationsRepository {
  constructor(
    @Inject(DRIZZLE)
    private readonly db: NodePgDatabase<typeof schema>,
  ) {}

  async create(data: CreateNotificationData): Promise<NotificationData> {
    const [newNotification] = await this.db
      .insert(notifications)
      .values({
        userId: data.userId,
        title: data.title,
        message: data.message,
        matchedItemId: data.matchedItemId,
      })
      .returning();

    return newNotification as NotificationData;
  }

  async findById(id: string): Promise<NotificationData | null> {
    const [notification] = await this.db
      .select()
      .from(notifications)
      .where(eq(notifications.id, id))
      .limit(1);

    return (notification as NotificationData) ?? null;
  }

  async findByUserId(userId: string, skip: number = 0, take: number = 20): Promise<NotificationData[]> {
    const userNotifications = await this.db
      .select()
      .from(notifications)
      .where(eq(notifications.userId, userId))
      .orderBy(desc(notifications.createdAt))
      .limit(take)
      .offset(skip);

    return userNotifications as NotificationData[];
  }

  async countByUserId(userId: string): Promise<number> {
    const [result] = await this.db
      .select({ count: count() })
      .from(notifications)
      .where(eq(notifications.userId, userId));

    return result?.count ?? 0;
  }

  async markAsRead(id: string): Promise<NotificationData> {
    const [updatedNotification] = await this.db
      .update(notifications)
      .set({ isRead: true })
      .where(eq(notifications.id, id))
      .returning();

    return updatedNotification as NotificationData;
  }

  async delete(id: string): Promise<void> {
    await this.db.delete(notifications).where(eq(notifications.id, id));
  }
}

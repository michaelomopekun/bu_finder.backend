export const NOTIFICATIONS_REPOSITORY = 'NOTIFICATIONS_REPOSITORY';

export interface NotificationData {
  id: string;
  userId: string;
  title: string;
  message: string;
  matchedItemId?: string;
  isRead: boolean;
  createdAt: Date;
}

export interface CreateNotificationData {
  userId: string;
  title: string;
  message: string;
  matchedItemId?: string;
}

export interface INotificationsRepository {
  create(data: CreateNotificationData): Promise<NotificationData>;
  findById(id: string): Promise<NotificationData | null>;
  findByUserId(userId: string, skip?: number, take?: number): Promise<NotificationData[]>;
  countByUserId(userId: string): Promise<number>;
  markAsRead(id: string): Promise<NotificationData>;
  delete(id: string): Promise<void>;
}

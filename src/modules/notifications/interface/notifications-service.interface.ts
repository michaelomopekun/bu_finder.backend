export const NOTIFICATIONS_SERVICE = 'NOTIFICATIONS_SERVICE';

import { CreateNotificationDto, NotificationResponseDto, PaginatedNotificationsDto, UpdateNotificationDto } from '../dto';

export interface INotificationsService {
  createNotification(userId: string, title: string, message: string, matchedItemId?: string): Promise<NotificationResponseDto>;
  getUserNotifications(userId: string, skip?: number, take?: number): Promise<PaginatedNotificationsDto>;
  markAsRead(notificationId: string, userId: string): Promise<NotificationResponseDto>;
  deleteNotification(notificationId: string): Promise<void>;
}

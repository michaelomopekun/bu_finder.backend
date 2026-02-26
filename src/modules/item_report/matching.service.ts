import { Injectable, Inject, Logger } from '@nestjs/common';
import type { IItemsRepository, SearchItemsParams } from '../item_report/interface/item-repository.interface';
import { ITEMS_REPOSITORY } from '../item_report/interface/item-repository.interface';
import type { INotificationsService } from '../notifications/interface';
import { NOTIFICATIONS_SERVICE } from '../notifications/interface';
import type { ItemData } from '../item_report/interface/item-repository.interface';
import { EmailService } from '../../common/email/email.service';
import { eq } from 'drizzle-orm';
import { Inject as NestInject } from '@nestjs/common';
import { DRIZZLE } from '../../db/db.module';
import type { NodePgDatabase } from 'drizzle-orm/node-postgres';
import * as schema from '../../db/schema';
import { users } from '../../db/schema';

@Injectable()
export class MatchingService {
  private readonly logger = new Logger(MatchingService.name);

  constructor(
    @Inject(ITEMS_REPOSITORY)
    private readonly itemsRepository: IItemsRepository,
    @Inject(NOTIFICATIONS_SERVICE)
    private readonly notificationsService: INotificationsService,
    private readonly emailService: EmailService,
    @NestInject(DRIZZLE)
    private readonly db: NodePgDatabase<typeof schema>,
  ) {}

  /**
   * Performs automatic matching when an item is approved
   * Finds matching items of opposite type and creates notifications
   */
  async matchItem(itemId: string, itemType: string): Promise<void> {
    try {
      const item = await this.itemsRepository.findById(itemId);
      if (!item) {
        this.logger.warn(`Item ${itemId} not found for matching`);
        return;
      }

      // Find opposite type items
      const oppositeType = itemType === 'LOST' ? 'FOUND' : 'LOST';

      const searchParams: SearchItemsParams = {
        query: item.title,
        type: oppositeType as any,
        limit: 100,
        offset: 0,
      };

      const matches = await this.itemsRepository.searchItems(searchParams);

      // Filter for matches with score >= 0.5
      const qualifiedMatches = matches.filter((match) => match.matchScore >= 0.5);

      this.logger.log(
        `Found ${qualifiedMatches.length} matches for item ${itemId} (${itemType})`,
      );

      // Create notifications for each match
      for (const matchedItem of qualifiedMatches) {
        await this.createMatchNotifications(item, matchedItem);
      }
    } catch (error) {
      this.logger.error(`Error matching item ${itemId}:`, error);
      // Don't throw, just log - we don't want matching to break approval flow
    }
  }

  /**
   * Creates bidirectional notifications for matched items
   */
  private async createMatchNotifications(
    item1: ItemData,
    item2: ItemData & { matchScore: number },
  ): Promise<void> {
    try {
      const scorePercentage = Math.round(item2.matchScore * 100);

      // Fetch user data for both parties
      const [user1] = await this.db
        .select()
        .from(users)
        .where(eq(users.id, item1.submittedBy))
        .limit(1);

      const [user2] = await this.db
        .select()
        .from(users)
        .where(eq(users.id, item2.submittedBy))
        .limit(1);

      // Notification for item1 submitter
      await this.notificationsService.createNotification(
        item1.submittedBy,
        `Potential Match Found!`,
        `Someone found an item similar to your "${item1.title}". Match confidence: ${scorePercentage}%`,
        item2.id,
      );

      // Send email to item1 submitter (user1)
      if (user1?.email) {
        const emailHtml = this.emailService.generateMatchNotificationHtml(
          user1.fullName,
          item2.title,
          item2.description,
          item2.matchScore,
          item2.type as 'LOST' | 'FOUND',
        );

        await this.emailService.sendEmail({
          to: user1.email,
          subject: 'Potential Match Found! - BU Finder',
          html: emailHtml,
        }).catch((error) => {
          this.logger.error(`Failed to send email to ${user1.email}:`, error);
          // Don't throw - continue even if email fails
        });
      }

      // Notification for item2 submitter
      await this.notificationsService.createNotification(
        item2.submittedBy,
        `Potential Match Found!`,
        `Someone lost an item similar to the one you found "${item2.title}". Match confidence: ${scorePercentage}%`,
        item1.id,
      );

      // Send email to item2 submitter (user2)
      if (user2?.email) {
        const emailHtml = this.emailService.generateMatchNotificationHtml(
          user2.fullName,
          item1.title,
          item1.description,
          item2.matchScore,
          item1.type as 'LOST' | 'FOUND',
        );

        await this.emailService.sendEmail({
          to: user2.email,
          subject: 'Potential Match Found! - BU Finder',
          html: emailHtml,
        }).catch((error) => {
          this.logger.error(`Failed to send email to ${user2.email}:`, error);
          // Don't throw - continue even if email fails
        });
      }

      this.logger.log(
        `Created match notifications and sent emails for items ${item1.id} and ${item2.id}`,
      );
    } catch (error) {
      this.logger.error(
        `Error creating match notifications for items ${item1.id} and ${item2.id}:`,
        error,
      );
      // Don't throw - continue processing other matches
    }
  }
}

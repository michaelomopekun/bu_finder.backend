import { Injectable, Inject, Logger } from '@nestjs/common';
import type { IItemsRepository, SearchItemsParams } from '../item_report/interface/item-repository.interface';
import { ITEMS_REPOSITORY } from '../item_report/interface/item-repository.interface';
import type { INotificationsService } from '../notifications/interface';
import { NOTIFICATIONS_SERVICE } from '../notifications/interface';
import type { ItemData } from '../item_report/interface/item-repository.interface';
import { itemTypeEnum } from 'src/db/schema/enums';

@Injectable()
export class MatchingService {
  private readonly logger = new Logger(MatchingService.name);

  constructor(
    @Inject(ITEMS_REPOSITORY)
    private readonly itemsRepository: IItemsRepository,
    @Inject(NOTIFICATIONS_SERVICE)
    private readonly notificationsService: INotificationsService,
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

      // Notification for item1 submitter
      await this.notificationsService.createNotification(
        item1.submittedBy,
        `Potential Match Found!`,
        `Someone found an item similar to your "${item1.title}". Match confidence: ${scorePercentage}%`,
        item2.id,
      );

      // Notification for item2 submitter
      await this.notificationsService.createNotification(
        item2.submittedBy,
        `Potential Match Found!`,
        `Someone lost an item similar to the one you found "${item2.title}". Match confidence: ${scorePercentage}%`,
        item1.id,
      );

      this.logger.log(
        `Created match notifications for items ${item1.id} and ${item2.id}`,
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

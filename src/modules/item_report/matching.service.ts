import { Injectable, Inject, Logger } from '@nestjs/common';
import type { IItemsRepository, SearchItemsParams } from '../item_report/interface/item-repository.interface';
import { ITEMS_REPOSITORY } from '../item_report/interface/item-repository.interface';
import type { INotificationsService } from '../notifications/interface';
import { NOTIFICATIONS_SERVICE } from '../notifications/interface';
import type { ItemData } from '../item_report/interface/item-repository.interface';
import { EmailService } from '../../common/email/email.service';
import { AiMatchingService, MatchCandidate, MatchAreas } from '../../common/gemini/gemini.service';
import { eq } from 'drizzle-orm';
import { Inject as NestInject } from '@nestjs/common';
import { DRIZZLE } from '../../db/db.module';
import type { NodePgDatabase } from 'drizzle-orm/node-postgres';
import * as schema from '../../db/schema';
import { users } from '../../db/schema';

export interface MatchResultItem {
  item: ItemData;
  score: number;
  reasoning: string;
  matchMethod: 'groq-ai' | 'fuzzy-similarity';
  matchAreas: MatchAreas;
}

@Injectable()
export class MatchingService {
  private readonly logger = new Logger(MatchingService.name);

  constructor(
    @Inject(ITEMS_REPOSITORY)
    private readonly itemsRepository: IItemsRepository,
    @Inject(NOTIFICATIONS_SERVICE)
    private readonly notificationsService: INotificationsService,
    private readonly emailService: EmailService,
    private readonly aiMatchingService: AiMatchingService,
    @NestInject(DRIZZLE)
    private readonly db: NodePgDatabase<typeof schema>,
  ) {}

  /**
   * Performs automatic matching when an item is approved.
   * Uses Groq AI for intelligent multimodal matching (text + images),
   * with PostgreSQL similarity as a pre-filter fallback.
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

      // Step 1: Pre-filter with PostgreSQL similarity to get candidates
      const searchParams: SearchItemsParams = {
        query: item.title,
        type: oppositeType as any,
        limit: 100,
        offset: 0,
      };

      const preFilterMatches = await this.itemsRepository.searchItems(searchParams);
      const candidates = preFilterMatches.filter((match) => match.matchScore >= 0.1);

      if (candidates.length === 0) {
        this.logger.log(`No pre-filter candidates found for item ${itemId}`);
        return;
      }

      this.logger.log(
        `Found ${candidates.length} pre-filter candidates for item ${itemId}`,
      );

      // Step 2: Use Groq AI if the item has an image, otherwise fuzzy match
      if (this.aiMatchingService.isAvailable && item.imageUrl) {
        this.logger.log(`Item ${itemId} has an image, using Groq AI matching`);
        await this.matchWithAi(item, candidates);
      } else {
        if (!item.imageUrl) {
          this.logger.log(`Item ${itemId} has no image, using fuzzy similarity matching`);
        } else {
          this.logger.warn('Groq AI unavailable, falling back to fuzzy similarity matching');
        }
        await this.matchWithSimilarity(item, candidates);
      }
    } catch (error) {
      this.logger.error(`Error matching item ${itemId}:`, error);
    }
  }

  /**
   * Finds and returns potential matches for a given item (user-triggered).
   * Uses Groq AI if the item has an image, otherwise fuzzy similarity.
   */
  async findMatchesForItem(itemId: string): Promise<MatchResultItem[]> {
    const item = await this.itemsRepository.findById(itemId);
    if (!item) {
      this.logger.warn(`Item ${itemId} not found for matching`);
      return [];
    }

    const oppositeType = item.type === 'LOST' ? 'FOUND' : 'LOST';

    const searchParams: SearchItemsParams = {
      query: item.title,
      type: oppositeType as any,
      limit: 100,
      offset: 0,
    };

    const preFilterMatches = await this.itemsRepository.searchItems(searchParams);
    const candidates = preFilterMatches.filter((match) => match.matchScore >= 0.05);

    if (candidates.length === 0) {
      this.logger.log(`No candidates found for item ${itemId}`);
      return [];
    }

    // Use Groq AI if item has an image and service is available, otherwise fuzzy
    if (this.aiMatchingService.isAvailable && item.imageUrl) {
      this.logger.log(`Finding matches for item ${itemId} using Groq AI`);
      return this.findWithAi(item, candidates);
    } else {
      const method = !item.imageUrl ? 'no image' : 'Groq AI unavailable';
      this.logger.log(`Finding matches for item ${itemId} using fuzzy similarity (${method})`);
      return this.findWithSimilarity(candidates);
    }
  }

  /**
   * Returns Groq AI match results (without creating notifications)
   */
  private async findWithAi(
    item: ItemData,
    candidates: (ItemData & { matchScore: number })[],
  ): Promise<MatchResultItem[]> {
    const sourceCandidate: MatchCandidate = {
      id: item.id,
      title: item.title,
      description: item.description,
      category: item.category,
      location: item.location,
      imageUrl: item.imageUrl,
    };

    const matchCandidates: MatchCandidate[] = candidates.map((c) => ({
      id: c.id,
      title: c.title,
      description: c.description,
      category: c.category,
      location: c.location,
      imageUrl: c.imageUrl,
    }));

    const results: MatchResultItem[] = [];
    const batchSize = 10;

    for (let i = 0; i < matchCandidates.length; i += batchSize) {
      const batch = matchCandidates.slice(i, i + batchSize);
      const aiResults = await this.aiMatchingService.findMatches(sourceCandidate, batch);

      for (const match of aiResults.filter((r) => r.score >= 0.1)) {
        const matchedItem = candidates.find((c) => c.id === match.candidateId);
        if (matchedItem) {
          results.push({
            item: matchedItem,
            score: match.score,
            reasoning: match.reasoning,
            matchMethod: 'groq-ai',
            matchAreas: match.matchAreas,
          });
        }
      }
    }

    return results.sort((a, b) => b.score - a.score);
  }

  /**
   * Returns fuzzy similarity match results (without creating notifications)
   */
  private findWithSimilarity(
    candidates: (ItemData & { matchScore: number })[],
  ): MatchResultItem[] {
    return candidates
      .filter((match) => match.matchScore >= 0.1)
      .map((match) => ({
        item: match,
        score: match.matchScore,
        reasoning: 'Matched by text similarity',
        matchMethod: 'fuzzy-similarity' as const,
        matchAreas: {
          title: true,
          description: match.matchScore >= 0.1,
          category: false,
          location: false,
          image: false,
        },
      }))
      .sort((a, b) => b.score - a.score);
  }

  /**
   * AI-powered matching using Groq multimodal analysis
   */
  private async matchWithAi(
    item: ItemData,
    candidates: (ItemData & { matchScore: number })[],
  ): Promise<void> {
    const sourceCandidate: MatchCandidate = {
      id: item.id,
      title: item.title,
      description: item.description,
      category: item.category,
      location: item.location,
      imageUrl: item.imageUrl,
    };

    const matchCandidates: MatchCandidate[] = candidates.map((c) => ({
      id: c.id,
      title: c.title,
      description: c.description,
      category: c.category,
      location: c.location,
      imageUrl: c.imageUrl,
    }));

    // Process in batches of 10 to avoid token limits
    const batchSize = 10;
    for (let i = 0; i < matchCandidates.length; i += batchSize) {
      const batch = matchCandidates.slice(i, i + batchSize);

      const aiResults = await this.aiMatchingService.findMatches(
        sourceCandidate,
        batch,
      );

      // Filter for matches with AI confidence >= 0.1
      const qualifiedMatches = aiResults.filter((r) => r.score >= 0.05);

      this.logger.log(
        `AI batch ${Math.floor(i / batchSize) + 1}: ${qualifiedMatches.length}/${batch.length} qualified matches`,
      );

      for (const match of qualifiedMatches) {
        const matchedItem = candidates.find((c) => c.id === match.candidateId);
        if (matchedItem) {
          this.logger.log(
            `🎯 MATCH FOUND: "${item.title}" ↔ "${matchedItem.title}" | Score: ${Math.round(match.score * 100)}% | Reason: ${match.reasoning}`,
          );
          await this.createMatchNotifications(
            item,
            { ...matchedItem, matchScore: match.score },
            match.reasoning,
          );
        }
      }
    }
  }

  /**
   * Fallback: basic PostgreSQL similarity matching
   */
  private async matchWithSimilarity(
    item: ItemData,
    candidates: (ItemData & { matchScore: number })[],
  ): Promise<void> {
    const qualifiedMatches = candidates.filter((match) => match.matchScore >= 0.05);

    this.logger.log(
      `Similarity fallback: ${qualifiedMatches.length} matches for item ${item.id}`,
    );

    for (const matchedItem of qualifiedMatches) {
      this.logger.log(
        `🎯 MATCH FOUND (fuzzy): "${item.title}" ↔ "${matchedItem.title}" | Score: ${Math.round(matchedItem.matchScore * 100)}%`,
      );
      await this.createMatchNotifications(item, matchedItem);
    }
  }

  /**
   * Creates bidirectional notifications for matched items
   */
  private async createMatchNotifications(
    item1: ItemData,
    item2: ItemData & { matchScore: number },
    aiReasoning?: string,
  ): Promise<void> {
    try {
      const scorePercentage = Math.round(item2.matchScore * 100);
      const reasoningText = aiReasoning ? ` AI insight: ${aiReasoning}` : '';

      // Notification for item1 submitter
      await this.notificationsService.createNotification(
        item1.submittedBy,
        `Potential Match Found!`,
        `Someone found an item similar to your "${item1.title}". Match confidence: ${scorePercentage}%.${reasoningText}`,
        item2.id,
      );

      // Notification for item2 submitter
      await this.notificationsService.createNotification(
        item2.submittedBy,
        `Potential Match Found!`,
        `Someone lost an item similar to the one you found "${item2.title}". Match confidence: ${scorePercentage}%.${reasoningText}`,
        item1.id,
      );

      this.logger.log(
        `Created match notifications for items ${item1.id} and ${item2.id} (score: ${scorePercentage}%)`,
      );
    } catch (error) {
      this.logger.error(
        `Error creating match notifications for items ${item1.id} and ${item2.id}:`,
        error,
      );
    }
  }
}

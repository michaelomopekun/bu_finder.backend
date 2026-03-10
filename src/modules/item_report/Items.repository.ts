import { Injectable, Inject } from '@nestjs/common';
import { eq, count, sql, and, or, desc } from 'drizzle-orm';
import { NodePgDatabase } from 'drizzle-orm/node-postgres';
import { DRIZZLE } from '../../db/db.module';
import * as schema from '../../db/schema';
import { items } from '../../db/schema/index';
import { IItemsRepository, CreateItemData, ItemData, ItemCountByType, SearchItemsParams, SearchItemResult } from './interface/item-repository.interface';
import { itemStatuses, itemTypes } from 'src/db/schema';

@Injectable()
export class ItemsRepository implements IItemsRepository {
  constructor(
    @Inject(DRIZZLE)
    private readonly db: NodePgDatabase<typeof schema>,
  ) {}

    async getCountByUserId(userId: string): Promise<ItemCountByType> {
        // const result = await this.db
        //     .select({ count: count(items.id) })
        //     .from(items)
        //     .where(eq(items.submittedBy, userId));
        // return result[0]?.count ?? 0;

        const result = await this.db
            .select({
                lost: sql<number>`COUNT(CASE WHEN type = 'LOST' THEN 1 END)`,
                found: sql<number>`COUNT(CASE WHEN type = 'FOUND' THEN 1 END)`,
            })
            .from(items)
            .where(and(
                eq(items.submittedBy, userId),
                eq(items.status, itemStatuses.APPROVED)
            ));
        
        return {
            lost: result[0]?.lost ?? 0,
            found: result[0]?.found ?? 0,
        };
    }

    async delete(id: string): Promise<void> {
        await this.db.delete(items).where(eq(items.id, id));
    }

    async create(data: CreateItemData): Promise<ItemData> {
        const [newItem] = await this.db
        .insert(items)
        .values({
            title: data.title,
            description: data.description,
            category: data.category,
            location: data.location,
            type: data.type,
            imageUrl: data.imageUrl,
            submittedBy: data.submittedBy,
            status: 'PENDING',
        })
        .returning();

        return newItem as ItemData;
    }

    async findAll(): Promise<ItemData[]> {
        const allItems = await this.db
        .select()
        .from(items)
        .where(eq(items.status, itemStatuses.APPROVED));

        return allItems as ItemData[];
    }

    async findById(id: string): Promise<ItemData | null> {
        const [item] = await this.db
        .select()
        .from(items)
        .where(eq(items.id, id))
        .limit(1);

        return (item as ItemData) ?? null;
    }

    async findByUserId(userId: string): Promise<ItemData[]> {
        const userItems = await this.db
        .select()
        .from(items)
        .where(eq(items.submittedBy, userId));

        return userItems as ItemData[];
    }

    async updateStatus(
        id: string,
        status: itemStatuses,
    ): Promise<ItemData> {
        const [updatedItem] = await this.db
        .update(items)
        .set({ status })
        .where(eq(items.id, id))
        .returning();

        return updatedItem as ItemData;
    }

    async searchItems(params: SearchItemsParams): Promise<SearchItemResult[]> {
        const { query, type, location, category, limit, offset } = params;

        // Weighted matching formula via raw SQL
        const matchScoreExpression = sql<number>`
            (similarity(${items.title}, ${query}) * 0.4 +
             similarity(${items.description}, ${query}) * 0.35 +
             similarity(${items.category}, ${query}) * 0.15 +
             similarity(${items.location}, ${query}) * 0.10)
        `;

        let whereConditions = and(
            eq(items.status, itemStatuses.APPROVED),
            sql`${matchScoreExpression} > 0.05`
        );

        // Add optional filters
        if (type) {
            whereConditions = and(whereConditions, eq(items.type, type));
        }
        if (location) {
            whereConditions = and(whereConditions, eq(items.location, location));
        }
        if (category) {
            whereConditions = and(whereConditions, eq(items.category, category));
        }

        const results = await this.db
            .select({
                id: items.id,
                title: items.title,
                description: items.description,
                category: items.category,
                location: items.location,
                type: items.type,
                status: items.status,
                imageUrl: items.imageUrl,
                submittedBy: items.submittedBy,
                dateReported: items.dateReported,
                createdAt: items.createdAt,
                updatedAt: items.updatedAt,
                matchScore: matchScoreExpression,
            })
            .from(items)
            .where(whereConditions)
            .orderBy(matchScoreExpression)
            .limit(limit)
            .offset(offset);

        return results as SearchItemResult[];
    }

    async findRecentlyLostItems(limit: number, offset: number): Promise<ItemData[]> {
        const recentLostItems = await this.db
            .select()
            .from(items)
            .where(
                and(
                    eq(items.type, 'LOST'),
                    eq(items.status, itemStatuses.APPROVED)
                )
            )
            .orderBy(desc(items.createdAt))
            .limit(limit)
            .offset(offset);

        return recentLostItems as ItemData[];
    }

    async findRecentlyFoundItems(limit: number, offset: number): Promise<ItemData[]> {
        const recentFoundItems = await this.db
            .select()
            .from(items)
            .where(
                and(
                    eq(items.type, 'FOUND'),
                    eq(items.status, itemStatuses.APPROVED)
                )
            )
            .orderBy(desc(items.createdAt))
            .limit(limit)
            .offset(offset);

        return recentFoundItems as ItemData[];
    }

    async countApprovedItemsByType(type: itemTypes): Promise<number> {
        const [result] = await this.db
            .select({ total: count() })
            .from(items)
            .where(
                and(
                    eq(items.type, type),
                    eq(items.status, itemStatuses.APPROVED)
                )
            );

        return result?.total ?? 0;
    }

    async findPendingItems(limit: number, offset: number): Promise<ItemData[]> {
        const pendingItems = await this.db
            .select()
            .from(items)
            .where(eq(items.status, itemStatuses.PENDING))
            .orderBy(desc(items.createdAt))
            .limit(limit)
            .offset(offset);

        return pendingItems as ItemData[];
    }

    async countPendingItems(): Promise<number> {
        const [result] = await this.db
            .select({ total: count() })
            .from(items)
            .where(eq(items.status, itemStatuses.PENDING));

        return result?.total ?? 0;
    }

    async countAll(): Promise<number> {
        const [result] = await this.db
            .select({ total: count() })
            .from(items);

        return result?.total ?? 0;
    }

    async countByStatus(status: itemStatuses): Promise<number> {
        const [result] = await this.db
            .select({ total: count() })
            .from(items)
            .where(eq(items.status, status));

        return result?.total ?? 0;
    }
}
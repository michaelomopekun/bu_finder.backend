import { CreateItemDto } from '../dto/items.dto';
import { CreateItemData, ItemCountByType, ItemData, SearchItemsParams, SearchItemResult } from './item-repository.interface';

export interface IItemsService {
  createItem(dto: CreateItemData): Promise<ItemData>;
  getAllItems(): Promise<ItemData[]>;
  getItemById(id: string): Promise<ItemData>;
  getUserItems(userId: string): Promise<ItemData[]>;
  getUserItemCount(userId: string): Promise<ItemCountByType>;
  approveItem(id: string): Promise<ItemData>;
  rejectItem(id: string): Promise<ItemData>;
  updateStatus(id: string, status: any): Promise<ItemData>;
  searchItems(params: SearchItemsParams): Promise<SearchItemResult[]>;
  getRecentlyLostItems(limit: number, offset: number): Promise<{ items: ItemData[]; total: number }>;
  getRecentlyFoundItems(limit: number, offset: number): Promise<{ items: ItemData[]; total: number }>;
  getPendingItems(limit: number, offset: number): Promise<{ items: ItemData[]; total: number }>;
  getAdminMetrics(): Promise<{ totalReports: number; pendingApprovals: number; resolvedCases: number }>;
  findMatchesForItem(id: string): Promise<any[]>;
}

export const ITEMS_SERVICE = Symbol('ITEMS_SERVICE');
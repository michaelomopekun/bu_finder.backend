import { Injectable, Inject, NotFoundException, ForbiddenException, BadRequestException, Logger } from '@nestjs/common';
import { CreateItemData, ItemCountByType, ItemData, ITEMS_REPOSITORY, type IItemsRepository, SearchItemsParams, SearchItemResult } from './interface/item-repository.interface';
import { IItemsService } from './interface/item-service.interface';
import { itemStatuses } from 'src/db/schema';
import { MatchingService } from './matching.service';

@Injectable()
export class ItemsService implements IItemsService {
  private readonly logger = new Logger(ItemsService.name);

  constructor(
    @Inject(ITEMS_REPOSITORY)
    private readonly itemsRepository: IItemsRepository,
    private readonly matchingService: MatchingService,
  ) {}

    async getUserItemCount(userId: string): Promise<ItemCountByType> {
        return this.itemsRepository.getCountByUserId(userId);
    }

    async createItem( dto: CreateItemData): Promise<ItemData> {
        return this.itemsRepository.create({
        title: dto.title,
        description: dto.description,
        category: dto.category,
        location: dto.location,
        type: dto.type,
        imageUrl: dto.imageUrl,
        submittedBy: dto.submittedBy,
        });
    }

    async getAllItems(): Promise<ItemData[]> {
        return this.itemsRepository.findAll();
    }

    async getItemById(id: string): Promise<ItemData> {
        const item = await this.itemsRepository.findById(id);
        if (!item) {
        throw new NotFoundException(`Item with ID ${id} not found`);
        }
        return item;
    }

    async getUserItems(userId: string): Promise<ItemData[]> {
        return this.itemsRepository.findByUserId(userId);
    }

    async approveItem(id: string): Promise<ItemData> {
        const item = await this.getItemById(id);
        if (item.status !== 'PENDING') {
        throw new ForbiddenException('Only PENDING items can be approved');
        }
        const approvedItem = await this.itemsRepository.updateStatus(id, itemStatuses.APPROVED);
        
        // Trigger async matching (fire-and-forget)
        this.matchingService.matchItem(id, approvedItem.type as 'LOST' | 'FOUND').catch((error) => {
            this.logger.error(`Error triggering async matching for item ${id}:`, error);
        });

        return approvedItem;
    }

    async rejectItem(id: string): Promise<ItemData> {
        const item = await this.getItemById(id);
        if (item.status !== 'PENDING') {
        throw new ForbiddenException('Only PENDING items can be rejected');
        }
        return this.itemsRepository.updateStatus(id, itemStatuses.REJECTED);
    }

    async searchItems(params: SearchItemsParams): Promise<SearchItemResult[]> {
        if (!params.query || params.query.trim().length === 0) {
            throw new BadRequestException('Search query cannot be empty');
        }

        if (params.limit < 1 || params.limit > 100) {
            throw new BadRequestException('Limit must be between 1 and 100');
        }

        if (params.offset < 0) {
            throw new BadRequestException('Offset cannot be negative');
        }

        return this.itemsRepository.searchItems(params);
    }
}
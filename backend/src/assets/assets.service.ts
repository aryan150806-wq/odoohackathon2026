import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../common/prisma/prisma.service';
import { CreateAssetDto, UpdateAssetDto, AssetSearchDto, ASSET_SORT_FIELDS } from './dto/asset.dto';
import { AssetStateMachineService } from './asset-state-machine.service';

@Injectable()
export class AssetsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly stateMachine: AssetStateMachineService,
  ) {}

  /**
   * Register a new asset with auto-generated tag (AF-XXXX).
   */
  async create(dto: CreateAssetDto, userId: string) {
    // Verify category exists
    const category = await this.prisma.assetCategory.findUnique({
      where: { id: dto.categoryId },
    });
    if (!category) throw new BadRequestException('Invalid category');

    // Auto-generate asset tag atomically
    const assetTag = await this.generateAssetTag();

    const asset = await this.prisma.asset.create({
      data: {
        name: dto.name,
        assetTag,
        serialNumber: dto.serialNumber,
        categoryId: dto.categoryId,
        departmentId: dto.departmentId,
        acquisitionDate: new Date(dto.acquisitionDate),
        acquisitionCost: dto.acquisitionCost,
        condition: dto.condition || 'Good',
        location: dto.location,
        isBookable: dto.isBookable || false,
        customFieldValues: dto.customFieldValues || {},
      },
      include: {
        category: { select: { id: true, name: true } },
        department: { select: { id: true, name: true } },
      },
    });

    // Log
    await this.prisma.activityLog.create({
      data: {
        userId,
        action: 'ASSET_CREATED',
        entityType: 'Asset',
        entityId: asset.id,
        details: { assetTag, name: dto.name },
      },
    });

    return asset;
  }

  /**
   * Search and filter assets with pagination.
   * Sort fields are validated against a whitelist.
   */
  async findAll(query: AssetSearchDto) {
    const page = query.page || 1;
    const limit = Math.min(query.limit || 20, 100);
    const skip = (page - 1) * limit;

    // Validate sort field against whitelist
    const sortBy = query.sortBy && ASSET_SORT_FIELDS.includes(query.sortBy as any)
      ? query.sortBy
      : 'createdAt';
    const sortOrder = query.sortOrder === 'asc' ? 'asc' : 'desc';

    const where: Prisma.AssetWhereInput = {};

    if (query.search) {
      where.OR = [
        { assetTag: { contains: query.search, mode: 'insensitive' } },
        { serialNumber: { contains: query.search, mode: 'insensitive' } },
        { name: { contains: query.search, mode: 'insensitive' } },
      ];
    }
    if (query.categoryId) where.categoryId = query.categoryId;
    if (query.status) where.status = query.status;
    if (query.departmentId) where.departmentId = query.departmentId;
    if (query.location) where.location = { contains: query.location, mode: 'insensitive' };

    const [assets, total] = await Promise.all([
      this.prisma.asset.findMany({
        where,
        skip,
        take: limit,
        orderBy: { [sortBy]: sortOrder },
        include: {
          category: { select: { id: true, name: true } },
          department: { select: { id: true, name: true } },
        },
      }),
      this.prisma.asset.count({ where }),
    ]);

    return {
      data: assets,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Get single asset with full history.
   */
  async findOne(id: string) {
    const asset = await this.prisma.asset.findUnique({
      where: { id },
      include: {
        category: true,
        department: { select: { id: true, name: true } },
        allocations: {
          orderBy: { allocatedAt: 'desc' },
          take: 20,
          include: {
            user: { select: { id: true, name: true, email: true } },
            allocatedBy: { select: { id: true, name: true } },
          },
        },
        maintenanceRequests: {
          orderBy: { createdAt: 'desc' },
          take: 20,
          include: {
            requestedBy: { select: { id: true, name: true } },
            technician: { select: { id: true, name: true } },
          },
        },
        bookings: {
          orderBy: { startTime: 'desc' },
          take: 20,
          include: {
            user: { select: { id: true, name: true } },
          },
        },
      },
    });

    if (!asset) throw new NotFoundException('Asset not found');
    return asset;
  }

  /**
   * Update asset details (not status — use state machine for that).
   */
  async update(id: string, dto: UpdateAssetDto, userId: string) {
    const asset = await this.prisma.asset.findUnique({ where: { id } });
    if (!asset) throw new NotFoundException('Asset not found');

    const updated = await this.prisma.asset.update({
      where: { id },
      data: {
        ...(dto.name && { name: dto.name }),
        ...(dto.categoryId && { categoryId: dto.categoryId }),
        ...(dto.serialNumber !== undefined && { serialNumber: dto.serialNumber }),
        ...(dto.departmentId !== undefined && { departmentId: dto.departmentId }),
        ...(dto.acquisitionCost !== undefined && { acquisitionCost: dto.acquisitionCost }),
        ...(dto.condition && { condition: dto.condition }),
        ...(dto.location !== undefined && { location: dto.location }),
        ...(dto.isBookable !== undefined && { isBookable: dto.isBookable }),
        ...(dto.customFieldValues && { customFieldValues: dto.customFieldValues }),
      },
      include: {
        category: { select: { id: true, name: true } },
        department: { select: { id: true, name: true } },
      },
    });

    await this.prisma.activityLog.create({
      data: {
        userId,
        action: 'ASSET_UPDATED',
        entityType: 'Asset',
        entityId: id,
        details: { changes: dto as any },
      },
    });

    return updated;
  }

  // ── Private helpers ────────────────────────────────────────────────

  /**
   * Generate a unique asset tag: AF-0001, AF-0002, ...
   * Uses an atomic counter to prevent duplicates.
   */
  private async generateAssetTag(): Promise<string> {
    const counter = await this.prisma.assetTagCounter.upsert({
      where: { id: 'singleton' },
      update: { counter: { increment: 1 } },
      create: { id: 'singleton', counter: 1 },
    });

    return `AF-${String(counter.counter).padStart(4, '0')}`;
  }
}

import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { AssetStatus, Role } from '@prisma/client';
import { PrismaService } from '../common/prisma/prisma.service';
import { AssetStateMachineService } from '../assets/asset-state-machine.service';
import {
  CreateAllocationDto,
  ReturnAssetDto,
  CreateTransferRequestDto,
} from './dto/allocation.dto';

@Injectable()
export class AllocationsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly assetStateMachine: AssetStateMachineService,
  ) {}

  /**
   * Check if an asset can be allocated.
   * Returns current holder info if already allocated.
   * Used by both the allocation endpoint and the UI to show conflict info.
   */
  async canAllocate(assetId: string): Promise<{
    canAllocate: boolean;
    currentHolder?: { id: string; name: string; email: string; department?: string };
    asset?: { id: string; assetTag: string; name: string; status: AssetStatus };
  }> {
    const asset = await this.prisma.asset.findUnique({
      where: { id: assetId },
      select: { id: true, assetTag: true, name: true, status: true },
    });

    if (!asset) throw new NotFoundException('Asset not found');

    if (asset.status !== AssetStatus.AVAILABLE) {
      // Check if there's an active allocation
      const activeAllocation = await this.prisma.allocation.findFirst({
        where: { assetId, status: 'ACTIVE' },
        include: {
          user: {
            select: { id: true, name: true, email: true },
          },
          department: {
            select: { name: true },
          },
        },
      });

      return {
        canAllocate: false,
        asset,
        currentHolder: activeAllocation
          ? {
              id: activeAllocation.user.id,
              name: activeAllocation.user.name,
              email: activeAllocation.user.email,
              department: activeAllocation.department?.name,
            }
          : undefined,
      };
    }

    return { canAllocate: true, asset };
  }

  /**
   * Allocate an asset to a user.
   * Uses transaction + row-level locking to prevent race conditions.
   */
  async allocate(dto: CreateAllocationDto, allocatedById: string) {
    return this.prisma.$transaction(async (tx) => {
      // Row-level lock on the asset to serialize concurrent allocation attempts
      await tx.$queryRaw`SELECT 1 FROM "Asset" WHERE id = ${dto.assetId} FOR UPDATE`;

      // Check if asset can be allocated
      const asset = await tx.asset.findUnique({
        where: { id: dto.assetId },
        select: { id: true, assetTag: true, name: true, status: true },
      });

      if (!asset) throw new NotFoundException('Asset not found');

      if (asset.status !== AssetStatus.AVAILABLE) {
        const activeAllocation = await tx.allocation.findFirst({
          where: { assetId: dto.assetId, status: 'ACTIVE' },
          include: {
            user: { select: { id: true, name: true, email: true } },
            department: { select: { name: true } },
          },
        });

        throw new ConflictException({
          message: `Asset ${asset.assetTag} is currently held by ${activeAllocation?.user?.name || 'another user'}`,
          currentHolder: activeAllocation?.user,
          department: activeAllocation?.department?.name,
          allocationId: activeAllocation?.id,
          suggestTransfer: true,
        });
      }

      // Verify the target user exists
      const targetUser = await tx.user.findUnique({
        where: { id: dto.userId },
        select: { id: true, name: true },
      });
      if (!targetUser) throw new BadRequestException('Target user not found');

      // Create the allocation
      const allocation = await tx.allocation.create({
        data: {
          assetId: dto.assetId,
          userId: dto.userId,
          departmentId: dto.departmentId,
          expectedReturnDate: dto.expectedReturnDate
            ? new Date(dto.expectedReturnDate)
            : undefined,
          allocatedById,
        },
        include: {
          asset: { select: { id: true, assetTag: true, name: true } },
          user: { select: { id: true, name: true, email: true } },
        },
      });

      // Transition asset status via state machine
      await this.assetStateMachine.transition(
        dto.assetId,
        AssetStatus.ALLOCATED,
        {
          triggeredBy: allocatedById,
          reason: 'allocation',
          relatedEntityId: allocation.id,
        },
        tx,
      );

      // Create notification for the recipient
      await tx.notification.create({
        data: {
          userId: dto.userId,
          type: 'ASSET_ASSIGNED',
          title: 'Asset Assigned',
          message: `You have been assigned ${asset.assetTag} - ${asset.name}`,
          metadata: {
            assetId: asset.id,
            assetTag: asset.assetTag,
            allocationId: allocation.id,
          },
        },
      });

      return allocation;
    });
  }

  /**
   * Return an allocated asset.
   */
  async returnAsset(allocationId: string, dto: ReturnAssetDto, userId: string) {
    return this.prisma.$transaction(async (tx) => {
      const allocation = await tx.allocation.findUnique({
        where: { id: allocationId },
        include: { asset: true },
      });

      if (!allocation) throw new NotFoundException('Allocation not found');
      if (allocation.status !== 'ACTIVE') {
        throw new BadRequestException('This allocation is not active');
      }

      // Update allocation
      await tx.allocation.update({
        where: { id: allocationId },
        data: {
          status: 'RETURNED',
          returnedAt: new Date(),
          returnConditionNotes: dto.returnConditionNotes,
        },
      });

      // Transition asset back to Available
      await this.assetStateMachine.transition(
        allocation.assetId,
        AssetStatus.AVAILABLE,
        {
          triggeredBy: userId,
          reason: 'return',
          relatedEntityId: allocationId,
        },
        tx,
      );

      // Log
      await tx.activityLog.create({
        data: {
          userId,
          action: 'ASSET_RETURNED',
          entityType: 'Allocation',
          entityId: allocationId,
          details: {
            assetTag: allocation.asset.assetTag,
            conditionNotes: dto.returnConditionNotes,
          },
        },
      });

      return { message: 'Asset returned successfully' };
    });
  }

  /**
   * Create a transfer request.
   */
  async createTransferRequest(dto: CreateTransferRequestDto, requestedById: string) {
    const allocation = await this.prisma.allocation.findUnique({
      where: { id: dto.allocationId },
      include: { user: true, asset: true },
    });

    if (!allocation) throw new NotFoundException('Allocation not found');
    if (allocation.status !== 'ACTIVE') {
      throw new BadRequestException('Allocation is not active');
    }

    const transfer = await this.prisma.transferRequest.create({
      data: {
        allocationId: dto.allocationId,
        fromUserId: allocation.userId,
        toUserId: dto.toUserId,
        reason: dto.reason,
      },
      include: {
        fromUser: { select: { id: true, name: true } },
        toUser: { select: { id: true, name: true } },
        allocation: {
          include: {
            asset: { select: { id: true, assetTag: true, name: true } },
          },
        },
      },
    });

    return transfer;
  }

  /**
   * Approve a transfer request — reallocate the asset.
   */
  async approveTransfer(transferId: string, approvedById: string) {
    return this.prisma.$transaction(async (tx) => {
      const transfer = await tx.transferRequest.findUnique({
        where: { id: transferId },
        include: {
          allocation: { include: { asset: true } },
          fromUser: { select: { id: true, name: true } },
          toUser: { select: { id: true, name: true } },
        },
      });

      if (!transfer) throw new NotFoundException('Transfer request not found');
      if (transfer.status !== 'REQUESTED') {
        throw new BadRequestException('Transfer already processed');
      }

      // Close the old allocation
      await tx.allocation.update({
        where: { id: transfer.allocationId },
        data: { status: 'TRANSFERRED' },
      });

      // Create new allocation for the recipient
      const newAllocation = await tx.allocation.create({
        data: {
          assetId: transfer.allocation.assetId,
          userId: transfer.toUserId,
          allocatedById: approvedById,
        },
      });

      // Update transfer status
      await tx.transferRequest.update({
        where: { id: transferId },
        data: {
          status: 'COMPLETED',
          approvedById,
          approvedAt: new Date(),
        },
      });

      // Notification
      await tx.notification.create({
        data: {
          userId: transfer.toUserId,
          type: 'TRANSFER_APPROVED',
          title: 'Transfer Approved',
          message: `${transfer.allocation.asset.assetTag} has been transferred to you`,
          metadata: {
            assetId: transfer.allocation.assetId,
            transferId,
          },
        },
      });

      // Log
      await tx.activityLog.create({
        data: {
          userId: approvedById,
          action: 'TRANSFER_APPROVED',
          entityType: 'TransferRequest',
          entityId: transferId,
          details: {
            assetTag: transfer.allocation.asset.assetTag,
            from: transfer.fromUser.name,
            to: transfer.toUser.name,
          },
        },
      });

      return { message: 'Transfer approved and asset reallocated', newAllocation };
    });
  }

  /**
   * Get all allocations with optional filters.
   */
  async findAll(filters?: { status?: string; userId?: string; assetId?: string }) {
    const where: any = {};
    if (filters?.status) where.status = filters.status;
    if (filters?.userId) where.userId = filters.userId;
    if (filters?.assetId) where.assetId = filters.assetId;

    return this.prisma.allocation.findMany({
      where,
      include: {
        asset: { select: { id: true, assetTag: true, name: true, status: true } },
        user: { select: { id: true, name: true, email: true } },
        department: { select: { id: true, name: true } },
        allocatedBy: { select: { id: true, name: true } },
      },
      orderBy: { allocatedAt: 'desc' },
    });
  }

  /**
   * Get overdue allocations (past expected return date, still active).
   */
  async getOverdue() {
    return this.prisma.allocation.findMany({
      where: {
        status: 'ACTIVE',
        expectedReturnDate: { lt: new Date() },
      },
      include: {
        asset: { select: { id: true, assetTag: true, name: true } },
        user: { select: { id: true, name: true, email: true } },
        department: { select: { id: true, name: true } },
      },
      orderBy: { expectedReturnDate: 'asc' },
    });
  }

  /**
   * Get transfer requests.
   */
  async getTransferRequests(filters?: { status?: string }) {
    const where: any = {};
    if (filters?.status) where.status = filters.status;

    return this.prisma.transferRequest.findMany({
      where,
      include: {
        fromUser: { select: { id: true, name: true, email: true } },
        toUser: { select: { id: true, name: true, email: true } },
        allocation: {
          include: {
            asset: { select: { id: true, assetTag: true, name: true } },
          },
        },
      },
      orderBy: { requestedAt: 'desc' },
    });
  }
}

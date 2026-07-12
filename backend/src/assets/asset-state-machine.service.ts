import {
  Injectable,
  BadRequestException,
} from '@nestjs/common';
import { AssetStatus, Prisma } from '@prisma/client';
import { PrismaService } from '../common/prisma/prisma.service';

type PrismaTransactionClient = Prisma.TransactionClient;

/**
 * Valid transitions in the Asset lifecycle state machine.
 * Only these transitions are allowed — everything else is rejected.
 */
const VALID_TRANSITIONS: Record<AssetStatus, AssetStatus[]> = {
  [AssetStatus.AVAILABLE]: [
    AssetStatus.ALLOCATED,
    AssetStatus.RESERVED,
    AssetStatus.UNDER_MAINTENANCE,
    AssetStatus.RETIRED,
    AssetStatus.LOST,
  ],
  [AssetStatus.ALLOCATED]: [
    AssetStatus.AVAILABLE,
    AssetStatus.LOST,
  ],
  [AssetStatus.RESERVED]: [
    AssetStatus.AVAILABLE,
  ],
  [AssetStatus.UNDER_MAINTENANCE]: [
    AssetStatus.AVAILABLE,
  ],
  [AssetStatus.LOST]: [], // Dead end — admin override needed
  [AssetStatus.RETIRED]: [
    AssetStatus.DISPOSED,
  ],
  [AssetStatus.DISPOSED]: [], // Terminal state
};

interface TransitionContext {
  triggeredBy: string;        // userId
  reason: string;             // e.g., "allocation", "maintenance_approved"
  relatedEntityId?: string;   // allocationId, maintenanceRequestId, etc.
}

@Injectable()
export class AssetStateMachineService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Transition an asset to a new status.
   * Validates the transition is allowed, performs the update, and logs it.
   * 
   * @param assetId - The asset to transition
   * @param targetStatus - The desired new status
   * @param context - Who/why/what triggered the transition
   * @param tx - Optional Prisma transaction client (use if already in a transaction)
   */
  async transition(
    assetId: string,
    targetStatus: AssetStatus,
    context: TransitionContext,
    tx?: PrismaTransactionClient,
  ) {
    const client = tx || this.prisma;

    const asset = await client.asset.findUnique({
      where: { id: assetId },
      select: { id: true, status: true, assetTag: true, name: true },
    });

    if (!asset) {
      throw new BadRequestException(`Asset ${assetId} not found`);
    }

    const currentStatus = asset.status;
    const allowedTargets = VALID_TRANSITIONS[currentStatus];

    if (!allowedTargets.includes(targetStatus)) {
      throw new BadRequestException(
        `Invalid status transition: ${currentStatus} → ${targetStatus} is not allowed for asset ${asset.assetTag}`,
      );
    }

    // Perform the update
    const updated = await client.asset.update({
      where: { id: assetId },
      data: { status: targetStatus },
    });

    // Write activity log entry
    await client.activityLog.create({
      data: {
        userId: context.triggeredBy,
        action: 'ASSET_STATUS_CHANGED',
        entityType: 'Asset',
        entityId: assetId,
        details: {
          assetTag: asset.assetTag,
          assetName: asset.name,
          fromStatus: currentStatus,
          toStatus: targetStatus,
          reason: context.reason,
          relatedEntityId: context.relatedEntityId,
        },
      },
    });

    return updated;
  }

  /**
   * Check if a transition is valid without performing it.
   */
  canTransition(currentStatus: AssetStatus, targetStatus: AssetStatus): boolean {
    return VALID_TRANSITIONS[currentStatus]?.includes(targetStatus) ?? false;
  }

  /**
   * Get all valid target statuses from the current status.
   */
  getValidTransitions(currentStatus: AssetStatus): AssetStatus[] {
    return VALID_TRANSITIONS[currentStatus] ?? [];
  }
}

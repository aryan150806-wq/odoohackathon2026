import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { AssetStatus, MaintenanceStatus } from '@prisma/client';
import { PrismaService } from '../common/prisma/prisma.service';
import { AssetStateMachineService } from '../assets/asset-state-machine.service';

const VALID_MAINTENANCE_TRANSITIONS: Record<MaintenanceStatus, MaintenanceStatus[]> = {
  [MaintenanceStatus.PENDING]: [MaintenanceStatus.APPROVED, MaintenanceStatus.REJECTED],
  [MaintenanceStatus.APPROVED]: [MaintenanceStatus.TECHNICIAN_ASSIGNED],
  [MaintenanceStatus.REJECTED]: [], // Terminal
  [MaintenanceStatus.TECHNICIAN_ASSIGNED]: [MaintenanceStatus.IN_PROGRESS],
  [MaintenanceStatus.IN_PROGRESS]: [MaintenanceStatus.RESOLVED],
  [MaintenanceStatus.RESOLVED]: [], // Terminal
};

@Injectable()
export class MaintenanceService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly assetStateMachine: AssetStateMachineService,
  ) {}

  async create(data: {
    assetId: string;
    description: string;
    priority?: string;
  }, userId: string) {
    const asset = await this.prisma.asset.findUnique({
      where: { id: data.assetId },
      select: { id: true, assetTag: true, name: true },
    });
    if (!asset) throw new NotFoundException('Asset not found');

    const request = await this.prisma.maintenanceRequest.create({
      data: {
        assetId: data.assetId,
        requestedById: userId,
        description: data.description,
        priority: (data.priority as any) || 'MEDIUM',
      },
      include: {
        asset: { select: { id: true, assetTag: true, name: true } },
        requestedBy: { select: { id: true, name: true } },
      },
    });

    await this.prisma.activityLog.create({
      data: {
        userId,
        action: 'MAINTENANCE_REQUESTED',
        entityType: 'MaintenanceRequest',
        entityId: request.id,
        details: { assetTag: asset.assetTag, priority: data.priority },
      },
    });

    return request;
  }

  async transition(
    requestId: string,
    targetStatus: MaintenanceStatus,
    userId: string,
    extra?: { technicianId?: string },
  ) {
    return this.prisma.$transaction(async (tx) => {
      const request = await tx.maintenanceRequest.findUnique({
        where: { id: requestId },
        include: { asset: { select: { id: true, assetTag: true } } },
      });

      if (!request) throw new NotFoundException('Maintenance request not found');

      const allowed = VALID_MAINTENANCE_TRANSITIONS[request.status];
      if (!allowed.includes(targetStatus)) {
        throw new BadRequestException(
          `Invalid transition: ${request.status} → ${targetStatus}`,
        );
      }

      const updateData: any = { status: targetStatus };
      if (targetStatus === MaintenanceStatus.APPROVED) {
        updateData.approvedById = userId;
      }
      if (targetStatus === MaintenanceStatus.TECHNICIAN_ASSIGNED && extra?.technicianId) {
        updateData.technicianId = extra.technicianId;
      }
      if (targetStatus === MaintenanceStatus.RESOLVED) {
        updateData.resolvedAt = new Date();
      }

      const updated = await tx.maintenanceRequest.update({
        where: { id: requestId },
        data: updateData,
        include: {
          asset: { select: { id: true, assetTag: true, name: true } },
          requestedBy: { select: { id: true, name: true } },
          technician: { select: { id: true, name: true } },
        },
      });

      // Auto-sync asset status on approval and resolution
      if (targetStatus === MaintenanceStatus.APPROVED) {
        await this.assetStateMachine.transition(
          request.assetId,
          AssetStatus.UNDER_MAINTENANCE,
          { triggeredBy: userId, reason: 'maintenance_approved', relatedEntityId: requestId },
          tx,
        );

        await tx.notification.create({
          data: {
            userId: request.requestedById,
            type: 'MAINTENANCE_APPROVED',
            title: 'Maintenance Approved',
            message: `Maintenance for ${request.asset.assetTag} has been approved`,
            metadata: { requestId, assetId: request.assetId },
          },
        });
      }

      if (targetStatus === MaintenanceStatus.REJECTED) {
        await tx.notification.create({
          data: {
            userId: request.requestedById,
            type: 'MAINTENANCE_REJECTED',
            title: 'Maintenance Rejected',
            message: `Maintenance request for ${request.asset.assetTag} has been rejected`,
            metadata: { requestId, assetId: request.assetId },
          },
        });
      }

      if (targetStatus === MaintenanceStatus.RESOLVED) {
        await this.assetStateMachine.transition(
          request.assetId,
          AssetStatus.AVAILABLE,
          { triggeredBy: userId, reason: 'maintenance_resolved', relatedEntityId: requestId },
          tx,
        );
      }

      await tx.activityLog.create({
        data: {
          userId,
          action: `MAINTENANCE_${targetStatus}`,
          entityType: 'MaintenanceRequest',
          entityId: requestId,
          details: { assetTag: request.asset.assetTag, from: request.status, to: targetStatus },
        },
      });

      return updated;
    });
  }

  async findAll(filters?: { status?: string; assetId?: string }) {
    const where: any = {};
    if (filters?.status) where.status = filters.status;
    if (filters?.assetId) where.assetId = filters.assetId;

    return this.prisma.maintenanceRequest.findMany({
      where,
      include: {
        asset: { select: { id: true, assetTag: true, name: true } },
        requestedBy: { select: { id: true, name: true } },
        technician: { select: { id: true, name: true } },
        approvedBy: { select: { id: true, name: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: string) {
    const request = await this.prisma.maintenanceRequest.findUnique({
      where: { id },
      include: {
        asset: true,
        requestedBy: { select: { id: true, name: true, email: true } },
        technician: { select: { id: true, name: true } },
        approvedBy: { select: { id: true, name: true } },
      },
    });
    if (!request) throw new NotFoundException('Maintenance request not found');
    return request;
  }
}

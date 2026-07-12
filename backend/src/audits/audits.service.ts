import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { AssetStatus, AuditCycleStatus } from '@prisma/client';
import { PrismaService } from '../common/prisma/prisma.service';

@Injectable()
export class AuditsService {
  constructor(private readonly prisma: PrismaService) {}

  async createCycle(data: {
    name: string;
    scopeType: 'DEPARTMENT' | 'LOCATION';
    departmentId?: string;
    location?: string;
    startDate: string;
    endDate: string;
    auditorIds: string[];
  }, createdById: string) {
    const cycle = await this.prisma.$transaction(async (tx) => {
      const newCycle = await tx.auditCycle.create({
        data: {
          name: data.name,
          scopeType: data.scopeType,
          departmentId: data.departmentId,
          location: data.location,
          startDate: new Date(data.startDate),
          endDate: new Date(data.endDate),
          createdById,
          auditors: { connect: data.auditorIds.map(id => ({ id })) },
        },
      });

      // Auto-populate audit items based on scope
      const assetWhere: any = {};
      if (data.scopeType === 'DEPARTMENT' && data.departmentId) {
        assetWhere.departmentId = data.departmentId;
      }
      if (data.scopeType === 'LOCATION' && data.location) {
        assetWhere.location = { contains: data.location, mode: 'insensitive' };
      }
      assetWhere.status = { notIn: ['DISPOSED'] };

      const assets = await tx.asset.findMany({ where: assetWhere, select: { id: true } });

      if (assets.length > 0) {
        await tx.auditItem.createMany({
          data: assets.map(a => ({
            auditCycleId: newCycle.id,
            assetId: a.id,
          })),
        });
      }

      await tx.activityLog.create({
        data: {
          userId: createdById,
          action: 'AUDIT_CYCLE_CREATED',
          entityType: 'AuditCycle',
          entityId: newCycle.id,
          details: { name: data.name, assetCount: assets.length },
        },
      });

      return newCycle;
    });

    return this.findCycle(cycle.id);
  }

  async findAllCycles() {
    return this.prisma.auditCycle.findMany({
      include: {
        department: { select: { id: true, name: true } },
        createdBy: { select: { id: true, name: true } },
        _count: { select: { items: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findCycle(id: string) {
    const cycle = await this.prisma.auditCycle.findUnique({
      where: { id },
      include: {
        department: { select: { id: true, name: true } },
        createdBy: { select: { id: true, name: true } },
        auditors: { select: { id: true, name: true, email: true } },
        items: {
          include: {
            asset: { select: { id: true, assetTag: true, name: true, status: true } },
            verifiedBy: { select: { id: true, name: true } },
          },
        },
      },
    });
    if (!cycle) throw new NotFoundException('Audit cycle not found');
    return cycle;
  }

  async verifyItem(itemId: string, data: {
    status: 'VERIFIED' | 'MISSING' | 'DAMAGED';
    notes?: string;
  }, userId: string) {
    const item = await this.prisma.auditItem.findUnique({
      where: { id: itemId },
      include: { auditCycle: true },
    });
    if (!item) throw new NotFoundException('Audit item not found');
    if (item.auditCycle.status === 'COMPLETED') {
      throw new BadRequestException('Cannot modify items in a completed cycle');
    }

    // Move cycle to IN_PROGRESS if still PLANNED
    if (item.auditCycle.status === 'PLANNED') {
      await this.prisma.auditCycle.update({
        where: { id: item.auditCycleId },
        data: { status: 'IN_PROGRESS' },
      });
    }

    return this.prisma.auditItem.update({
      where: { id: itemId },
      data: {
        status: data.status as any,
        notes: data.notes,
        verifiedById: userId,
        verifiedAt: new Date(),
      },
      include: {
        asset: { select: { id: true, assetTag: true, name: true } },
        verifiedBy: { select: { id: true, name: true } },
      },
    });
  }

  /**
   * Close cycle atomically — locks cycle + updates all flagged asset statuses.
   */
  async closeCycle(cycleId: string, closedById: string) {
    return this.prisma.$transaction(async (tx) => {
      const cycle = await tx.auditCycle.findUnique({
        where: { id: cycleId },
      });
      if (!cycle) throw new NotFoundException('Audit cycle not found');
      if (cycle.status !== 'IN_PROGRESS') {
        throw new BadRequestException('Cycle must be in progress to close');
      }

      // Check all items are verified
      const unverified = await tx.auditItem.count({
        where: { auditCycleId: cycleId, status: 'PENDING' },
      });
      if (unverified > 0) {
        throw new BadRequestException(`${unverified} items have not been verified yet`);
      }

      // Update cycle status
      await tx.auditCycle.update({
        where: { id: cycleId },
        data: { status: 'COMPLETED' },
      });

      // Update asset statuses for missing items → Lost
      const missingItems = await tx.auditItem.findMany({
        where: { auditCycleId: cycleId, status: 'MISSING' },
        include: { asset: { select: { id: true, assetTag: true } } },
      });

      for (const item of missingItems) {
        await tx.asset.update({
          where: { id: item.assetId },
          data: { status: AssetStatus.LOST },
        });

        await tx.notification.create({
          data: {
            userId: closedById,
            type: 'AUDIT_DISCREPANCY',
            title: 'Audit Discrepancy',
            message: `Asset ${item.asset.assetTag} marked as MISSING and status updated to LOST`,
            metadata: { assetId: item.assetId, cycleId },
          },
        });
      }

      const damagedCount = await tx.auditItem.count({
        where: { auditCycleId: cycleId, status: 'DAMAGED' },
      });

      // Log
      await tx.activityLog.create({
        data: {
          userId: closedById,
          action: 'AUDIT_CYCLE_CLOSED',
          entityType: 'AuditCycle',
          entityId: cycleId,
          details: {
            missingCount: missingItems.length,
            damagedCount,
          },
        },
      });

      return {
        message: 'Audit cycle closed',
        missingAssetsUpdated: missingItems.length,
        damagedAssetsFound: damagedCount,
      };
    });
  }

  async getDiscrepancyReport(cycleId: string) {
    return this.prisma.auditItem.findMany({
      where: {
        auditCycleId: cycleId,
        status: { in: ['MISSING', 'DAMAGED'] },
      },
      include: {
        asset: {
          select: {
            id: true, assetTag: true, name: true, status: true,
            location: true, department: { select: { name: true } },
          },
        },
        verifiedBy: { select: { id: true, name: true } },
      },
    });
  }
}

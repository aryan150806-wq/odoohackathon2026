import { Injectable } from '@nestjs/common';
import { PrismaService } from '../common/prisma/prisma.service';

@Injectable()
export class ReportsService {
  constructor(private readonly prisma: PrismaService) {}

  async getDashboardKPIs() {
    const [
      assetsAvailable, assetsAllocated, maintenanceToday,
      activeBookings, pendingTransfers, upcomingReturns, overdueReturns,
    ] = await Promise.all([
      this.prisma.asset.count({ where: { status: 'AVAILABLE' } }),
      this.prisma.asset.count({ where: { status: 'ALLOCATED' } }),
      this.prisma.maintenanceRequest.count({
        where: {
          status: { in: ['APPROVED', 'IN_PROGRESS', 'TECHNICIAN_ASSIGNED'] },
          createdAt: {
            gte: new Date(new Date().setHours(0, 0, 0, 0)),
            lt: new Date(new Date().setHours(23, 59, 59, 999)),
          },
        },
      }),
      this.prisma.booking.count({ where: { status: { in: ['UPCOMING', 'ONGOING'] } } }),
      this.prisma.transferRequest.count({ where: { status: 'REQUESTED' } }),
      this.prisma.allocation.count({
        where: {
          status: 'ACTIVE',
          expectedReturnDate: { gte: new Date(), lte: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) },
        },
      }),
      this.prisma.allocation.count({
        where: { status: 'ACTIVE', expectedReturnDate: { lt: new Date() } },
      }),
    ]);

    return {
      assetsAvailable, assetsAllocated, maintenanceToday,
      activeBookings, pendingTransfers, upcomingReturns, overdueReturns,
    };
  }

  async getAssetUtilization() {
    const assets = await this.prisma.asset.findMany({
      select: {
        id: true, assetTag: true, name: true, status: true,
        _count: { select: { allocations: true, bookings: true } },
      },
      orderBy: { allocations: { _count: 'desc' } },
      take: 20,
    });
    return assets;
  }

  async getMaintenanceFrequency() {
    const data = await this.prisma.maintenanceRequest.groupBy({
      by: ['assetId'],
      _count: { id: true },
      orderBy: { _count: { id: 'desc' } },
      take: 20,
    });

    const assetIds = data.map(d => d.assetId);
    const assets = await this.prisma.asset.findMany({
      where: { id: { in: assetIds } },
      select: { id: true, assetTag: true, name: true, category: { select: { name: true } } },
    });

    return data.map(d => ({
      ...d,
      asset: assets.find(a => a.id === d.assetId),
    }));
  }

  async getDepartmentAllocationSummary() {
    const departments = await this.prisma.department.findMany({
      select: {
        id: true, name: true,
        _count: { select: { assets: true, members: true } },
        assets: {
          select: { status: true },
        },
      },
    });

    return departments.map(d => ({
      id: d.id,
      name: d.name,
      memberCount: d._count.members,
      totalAssets: d._count.assets,
      statusBreakdown: d.assets.reduce((acc: Record<string, number>, a) => {
        acc[a.status] = (acc[a.status] || 0) + 1;
        return acc;
      }, {}),
    }));
  }

  async getBookingHeatmap() {
    const bookings = await this.prisma.booking.findMany({
      where: { status: { notIn: ['CANCELLED'] } },
      select: { startTime: true, endTime: true },
    });

    // Generate hour-of-day × day-of-week heatmap
    const heatmap: number[][] = Array(7).fill(null).map(() => Array(24).fill(0));
    for (const b of bookings) {
      const start = new Date(b.startTime);
      const dayOfWeek = start.getDay();
      const hour = start.getHours();
      heatmap[dayOfWeek][hour]++;
    }

    return heatmap;
  }

  async getRecentActivity(limit = 20) {
    return this.prisma.activityLog.findMany({
      take: limit,
      orderBy: { createdAt: 'desc' },
      include: {
        user: { select: { id: true, name: true } },
      },
    });
  }

  async getOverdueAllocations() {
    return this.prisma.allocation.findMany({
      where: { status: 'ACTIVE', expectedReturnDate: { lt: new Date() } },
      include: {
        asset: { select: { id: true, assetTag: true, name: true } },
        user: { select: { id: true, name: true, email: true } },
        department: { select: { name: true } },
      },
      orderBy: { expectedReturnDate: 'asc' },
    });
  }

  async getUpcomingReturns() {
    return this.prisma.allocation.findMany({
      where: {
        status: 'ACTIVE',
        expectedReturnDate: { gte: new Date(), lte: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) },
      },
      include: {
        asset: { select: { id: true, assetTag: true, name: true } },
        user: { select: { id: true, name: true } },
      },
      orderBy: { expectedReturnDate: 'asc' },
    });
  }
}

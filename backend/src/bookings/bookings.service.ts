import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../common/prisma/prisma.service';
import { CreateBookingDto, RescheduleBookingDto } from './dto/booking.dto';

@Injectable()
export class BookingsService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Check for booking overlap using half-open interval [startTime, endTime).
   * Uses transaction + row-level lock to prevent race conditions.
   */
  async hasOverlap(
    assetId: string,
    startTime: Date,
    endTime: Date,
    excludingBookingId?: string,
  ): Promise<{
    overlaps: boolean;
    conflictingBooking?: {
      id: string;
      startTime: Date;
      endTime: Date;
      user: { name: string };
    };
  }> {
    const conflict = await this.prisma.booking.findFirst({
      where: {
        assetId,
        status: { notIn: ['CANCELLED'] },
        ...(excludingBookingId ? { id: { not: excludingBookingId } } : {}),
        // Half-open interval overlap check:
        // existing.start < requested.end AND existing.end > requested.start
        startTime: { lt: endTime },
        endTime: { gt: startTime },
      },
      include: {
        user: { select: { name: true } },
      },
    });

    return conflict
      ? { overlaps: true, conflictingBooking: conflict }
      : { overlaps: false };
  }

  /**
   * Create a booking with overlap validation.
   * Uses transaction with row-level locking for concurrency safety.
   */
  async create(dto: CreateBookingDto, userId: string) {
    const startTime = new Date(dto.startTime);
    const endTime = new Date(dto.endTime);

    // Validate times
    if (startTime >= endTime) {
      throw new BadRequestException('Start time must be before end time');
    }
    if (startTime < new Date()) {
      throw new BadRequestException('Cannot book in the past');
    }

    return this.prisma.$transaction(async (tx) => {
      // Verify asset exists and is bookable
      const asset = await tx.asset.findUnique({
        where: { id: dto.assetId },
        select: { id: true, assetTag: true, name: true, isBookable: true },
      });

      if (!asset) throw new NotFoundException('Asset not found');
      if (!asset.isBookable) {
        throw new BadRequestException('This asset is not available for booking');
      }

      // Row-level lock on asset to serialize concurrent booking attempts
      await tx.$queryRaw`SELECT 1 FROM "Asset" WHERE id = ${dto.assetId} FOR UPDATE`;

      // Check for overlap
      const conflict = await tx.booking.findFirst({
        where: {
          assetId: dto.assetId,
          status: { notIn: ['CANCELLED'] },
          startTime: { lt: endTime },
          endTime: { gt: startTime },
        },
        include: {
          user: { select: { name: true } },
        },
      });

      if (conflict) {
        throw new ConflictException({
          message: `Booking conflicts with existing reservation (${conflict.startTime.toISOString()} - ${conflict.endTime.toISOString()}) by ${conflict.user.name}`,
          conflictingBooking: {
            id: conflict.id,
            startTime: conflict.startTime,
            endTime: conflict.endTime,
            bookedBy: conflict.user.name,
          },
        });
      }

      // Create the booking
      const booking = await tx.booking.create({
        data: {
          assetId: dto.assetId,
          userId,
          startTime,
          endTime,
          status: 'UPCOMING',
          purpose: dto.purpose,
        },
        include: {
          asset: { select: { id: true, assetTag: true, name: true } },
          user: { select: { id: true, name: true, email: true } },
        },
      });

      // Create notification
      await tx.notification.create({
        data: {
          userId,
          type: 'BOOKING_CONFIRMED',
          title: 'Booking Confirmed',
          message: `Your booking for ${asset.name} on ${startTime.toLocaleDateString()} has been confirmed`,
          metadata: {
            bookingId: booking.id,
            assetId: asset.id,
            assetTag: asset.assetTag,
          },
        },
      });

      // Log
      await tx.activityLog.create({
        data: {
          userId,
          action: 'BOOKING_CREATED',
          entityType: 'Booking',
          entityId: booking.id,
          details: {
            assetTag: asset.assetTag,
            startTime: startTime.toISOString(),
            endTime: endTime.toISOString(),
          },
        },
      });

      return booking;
    });
  }

  /**
   * Get bookings for a resource's calendar view.
   */
  async getCalendar(assetId: string, startDate?: string, endDate?: string) {
    const where: any = { assetId };

    if (startDate || endDate) {
      where.AND = [];
      if (startDate) where.AND.push({ endTime: { gte: new Date(startDate) } });
      if (endDate) where.AND.push({ startTime: { lte: new Date(endDate) } });
    }

    return this.prisma.booking.findMany({
      where,
      include: {
        user: { select: { id: true, name: true } },
        asset: { select: { id: true, assetTag: true, name: true } },
      },
      orderBy: { startTime: 'asc' },
    });
  }

  /**
   * Get all bookings for a user.
   */
  async findByUser(userId: string) {
    return this.prisma.booking.findMany({
      where: { userId },
      include: {
        asset: { select: { id: true, assetTag: true, name: true } },
      },
      orderBy: { startTime: 'desc' },
    });
  }

  /**
   * Cancel a booking.
   */
  async cancel(bookingId: string, userId: string) {
    const booking = await this.prisma.booking.findUnique({
      where: { id: bookingId },
      include: { asset: { select: { assetTag: true, name: true } } },
    });

    if (!booking) throw new NotFoundException('Booking not found');
    if (booking.status === 'CANCELLED') {
      throw new BadRequestException('Booking is already cancelled');
    }
    if (booking.status === 'COMPLETED') {
      throw new BadRequestException('Cannot cancel a completed booking');
    }

    const updated = await this.prisma.booking.update({
      where: { id: bookingId },
      data: {
        status: 'CANCELLED',
        cancelledAt: new Date(),
      },
    });

    await this.prisma.notification.create({
      data: {
        userId: booking.userId,
        type: 'BOOKING_CANCELLED',
        title: 'Booking Cancelled',
        message: `Your booking for ${booking.asset.name} has been cancelled`,
        metadata: { bookingId },
      },
    });

    await this.prisma.activityLog.create({
      data: {
        userId,
        action: 'BOOKING_CANCELLED',
        entityType: 'Booking',
        entityId: bookingId,
        details: { assetTag: booking.asset.assetTag },
      },
    });

    return updated;
  }

  /**
   * Reschedule a booking (re-checks overlap).
   */
  async reschedule(bookingId: string, dto: RescheduleBookingDto, userId: string) {
    const newStart = new Date(dto.startTime);
    const newEnd = new Date(dto.endTime);

    if (newStart >= newEnd) {
      throw new BadRequestException('Start time must be before end time');
    }

    return this.prisma.$transaction(async (tx) => {
      const booking = await tx.booking.findUnique({
        where: { id: bookingId },
      });

      if (!booking) throw new NotFoundException('Booking not found');
      if (booking.status !== 'UPCOMING') {
        throw new BadRequestException('Can only reschedule upcoming bookings');
      }

      // Lock and check for overlap, excluding current booking
      await tx.$queryRaw`SELECT 1 FROM "Asset" WHERE id = ${booking.assetId} FOR UPDATE`;

      const conflict = await tx.booking.findFirst({
        where: {
          assetId: booking.assetId,
          status: { notIn: ['CANCELLED'] },
          id: { not: bookingId },
          startTime: { lt: newEnd },
          endTime: { gt: newStart },
        },
      });

      if (conflict) {
        throw new ConflictException('New time slot conflicts with an existing booking');
      }

      return tx.booking.update({
        where: { id: bookingId },
        data: {
          startTime: newStart,
          endTime: newEnd,
        },
        include: {
          asset: { select: { id: true, assetTag: true, name: true } },
          user: { select: { id: true, name: true } },
        },
      });
    });
  }

  /**
   * Get bookable resources (assets with isBookable=true).
   */
  async getBookableResources() {
    return this.prisma.asset.findMany({
      where: { isBookable: true, status: { not: 'DISPOSED' } },
      select: {
        id: true,
        assetTag: true,
        name: true,
        location: true,
        category: { select: { name: true } },
      },
      orderBy: { name: 'asc' },
    });
  }
}

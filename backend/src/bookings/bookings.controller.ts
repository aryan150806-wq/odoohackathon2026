import {
  Controller,
  Get,
  Post,
  Patch,
  Param,
  Body,
  Query,
  UseGuards,
} from '@nestjs/common';
import { BookingsService } from './bookings.service';
import { CreateBookingDto, RescheduleBookingDto } from './dto/booking.dto';
import { JwtAuthGuard, RolesGuard } from '../common/guards';
import { CurrentUser } from '../common/decorators';

@Controller('bookings')
@UseGuards(JwtAuthGuard, RolesGuard)
export class BookingsController {
  constructor(private readonly bookingsService: BookingsService) {}

  @Post()
  async create(
    @Body() dto: CreateBookingDto,
    @CurrentUser('id') userId: string,
  ) {
    return this.bookingsService.create(dto, userId);
  }

  @Get()
  async findAll() {
    return this.bookingsService.findAll();
  }

  @Get('resources')
  async getBookableResources() {
    return this.bookingsService.getBookableResources();
  }

  @Get('calendar/:assetId')
  async getCalendar(
    @Param('assetId') assetId: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    return this.bookingsService.getCalendar(assetId, startDate, endDate);
  }

  @Get('my')
  async findMyBookings(@CurrentUser('id') userId: string) {
    return this.bookingsService.findByUser(userId);
  }

  @Patch(':id/cancel')
  async cancel(
    @Param('id') id: string,
    @CurrentUser('id') userId: string,
  ) {
    return this.bookingsService.cancel(id, userId);
  }

  @Patch(':id/reschedule')
  async reschedule(
    @Param('id') id: string,
    @Body() dto: RescheduleBookingDto,
    @CurrentUser('id') userId: string,
  ) {
    return this.bookingsService.reschedule(id, dto, userId);
  }

  @Get('check-overlap')
  async checkOverlap(
    @Query('assetId') assetId: string,
    @Query('startTime') startTime: string,
    @Query('endTime') endTime: string,
    @Query('excludeId') excludeId?: string,
  ) {
    return this.bookingsService.hasOverlap(
      assetId,
      new Date(startTime),
      new Date(endTime),
      excludeId,
    );
  }
}

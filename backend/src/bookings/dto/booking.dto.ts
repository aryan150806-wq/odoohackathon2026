import {
  IsUUID,
  IsDateString,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';

export class CreateBookingDto {
  @IsUUID()
  assetId: string;

  @IsDateString()
  startTime: string;

  @IsDateString()
  endTime: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  purpose?: string;
}

export class RescheduleBookingDto {
  @IsDateString()
  startTime: string;

  @IsDateString()
  endTime: string;
}

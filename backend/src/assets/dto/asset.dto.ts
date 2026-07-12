import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsUUID,
  IsBoolean,
  IsNumber,
  IsDateString,
  IsEnum,
  MaxLength,
  IsArray,
  Min,
} from 'class-validator';
import { Type } from 'class-transformer';
import { AssetStatus } from '@prisma/client';

export class CreateAssetDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  name: string;

  @IsUUID()
  categoryId: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  serialNumber?: string;

  @IsOptional()
  @IsUUID()
  departmentId?: string;

  @IsDateString()
  acquisitionDate: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Type(() => Number)
  acquisitionCost?: number;

  @IsOptional()
  @IsString()
  @MaxLength(50)
  condition?: string;

  @IsOptional()
  @IsString()
  @MaxLength(200)
  location?: string;

  @IsOptional()
  @IsBoolean()
  isBookable?: boolean;

  @IsOptional()
  customFieldValues?: Record<string, any>;
}

export class UpdateAssetDto {
  @IsOptional()
  @IsString()
  @MaxLength(200)
  name?: string;

  @IsOptional()
  @IsUUID()
  categoryId?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  serialNumber?: string;

  @IsOptional()
  @IsUUID()
  departmentId?: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Type(() => Number)
  acquisitionCost?: number;

  @IsOptional()
  @IsString()
  @MaxLength(50)
  condition?: string;

  @IsOptional()
  @IsString()
  @MaxLength(200)
  location?: string;

  @IsOptional()
  @IsBoolean()
  isBookable?: boolean;

  @IsOptional()
  customFieldValues?: Record<string, any>;
}

// Whitelist of allowed sort fields — prevents SQL injection via ORDER BY
export const ASSET_SORT_FIELDS = [
  'name', 'assetTag', 'status', 'acquisitionDate', 'acquisitionCost',
  'condition', 'location', 'createdAt',
] as const;
export type AssetSortField = typeof ASSET_SORT_FIELDS[number];

export class AssetSearchDto {
  @IsOptional()
  @IsString()
  search?: string; // Searches assetTag, serialNumber, name

  @IsOptional()
  @IsUUID()
  categoryId?: string;

  @IsOptional()
  @IsEnum(AssetStatus)
  status?: AssetStatus;

  @IsOptional()
  @IsUUID()
  departmentId?: string;

  @IsOptional()
  @IsString()
  location?: string;

  @IsOptional()
  @IsString()
  sortBy?: string; // Validated against whitelist in service

  @IsOptional()
  @IsString()
  sortOrder?: 'asc' | 'desc';

  @IsOptional()
  @IsNumber()
  @Min(1)
  @Type(() => Number)
  page?: number;

  @IsOptional()
  @IsNumber()
  @Min(1)
  @Type(() => Number)
  limit?: number;
}

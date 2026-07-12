import {
  IsUUID,
  IsOptional,
  IsDateString,
  IsString,
  MaxLength,
} from 'class-validator';

export class CreateAllocationDto {
  @IsUUID()
  assetId: string;

  @IsUUID()
  userId: string;

  @IsOptional()
  @IsUUID()
  departmentId?: string;

  @IsOptional()
  @IsDateString()
  expectedReturnDate?: string;
}

export class ReturnAssetDto {
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  returnConditionNotes?: string;
}

export class CreateTransferRequestDto {
  @IsUUID()
  allocationId: string;

  @IsUUID()
  toUserId: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  reason?: string;
}

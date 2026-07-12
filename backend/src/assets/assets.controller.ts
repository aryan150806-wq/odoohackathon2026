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
import { Role } from '@prisma/client';
import { AssetsService } from './assets.service';
import { CreateAssetDto, UpdateAssetDto, AssetSearchDto } from './dto/asset.dto';
import { JwtAuthGuard, RolesGuard } from '../common/guards';
import { Roles, CurrentUser } from '../common/decorators';

@Controller('assets')
@UseGuards(JwtAuthGuard, RolesGuard)
export class AssetsController {
  constructor(private readonly assetsService: AssetsService) {}

  @Post()
  @Roles(Role.ADMIN, Role.ASSET_MANAGER)
  async create(
    @Body() dto: CreateAssetDto,
    @CurrentUser('id') userId: string,
  ) {
    return this.assetsService.create(dto, userId);
  }

  @Get()
  async findAll(@Query() query: AssetSearchDto) {
    return this.assetsService.findAll(query);
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.assetsService.findOne(id);
  }

  @Patch(':id')
  @Roles(Role.ADMIN, Role.ASSET_MANAGER)
  async update(
    @Param('id') id: string,
    @Body() dto: UpdateAssetDto,
    @CurrentUser('id') userId: string,
  ) {
    return this.assetsService.update(id, dto, userId);
  }
}

import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { MaintenanceService } from './maintenance.service';
import { MaintenanceController } from './maintenance.controller';
import { AssetsModule } from '../assets/assets.module';

@Module({
  imports: [JwtModule.register({}), AssetsModule],
  controllers: [MaintenanceController],
  providers: [MaintenanceService],
  exports: [MaintenanceService],
})
export class MaintenanceModule {}

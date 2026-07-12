import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { AllocationsService } from './allocations.service';
import { AllocationsController } from './allocations.controller';
import { AssetsModule } from '../assets/assets.module';

@Module({
  imports: [JwtModule.register({}), AssetsModule],
  controllers: [AllocationsController],
  providers: [AllocationsService],
  exports: [AllocationsService],
})
export class AllocationsModule {}

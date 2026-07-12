import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { AssetsService } from './assets.service';
import { AssetsController } from './assets.controller';
import { AssetStateMachineService } from './asset-state-machine.service';

@Module({
  imports: [JwtModule.register({})],
  controllers: [AssetsController],
  providers: [AssetsService, AssetStateMachineService],
  exports: [AssetsService, AssetStateMachineService],
})
export class AssetsModule {}

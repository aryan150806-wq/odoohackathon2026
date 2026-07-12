import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { AuditsService } from './audits.service';
import { AuditsController } from './audits.controller';

@Module({
  imports: [JwtModule.register({})],
  controllers: [AuditsController],
  providers: [AuditsService],
  exports: [AuditsService],
})
export class AuditsModule {}

import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { ReportsService } from './reports.service';
import { ReportsController } from './reports.controller';

@Module({
  imports: [JwtModule.register({})],
  controllers: [ReportsController],
  providers: [ReportsService],
})
export class ReportsModule {}

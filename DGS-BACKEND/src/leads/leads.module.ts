import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Lead } from './entities/lead.entity';
import { LeadTrialAsset } from './entities/lead-trial-asset.entity';
import { LeadCommunicationLog } from './entities/lead-communication-log.entity';
import { LeadConsultation } from './entities/lead-consultation.entity';
import { LeadsService } from './leads.service';
import { LeadsController } from './leads.controller';

@Module({
  imports: [TypeOrmModule.forFeature([Lead, LeadTrialAsset, LeadCommunicationLog, LeadConsultation])],
  controllers: [LeadsController],
  providers: [LeadsService],
  exports: [LeadsService],
})
export class LeadsModule {}

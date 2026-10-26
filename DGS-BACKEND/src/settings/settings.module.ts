import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CompanySetting } from './entities/company-setting.entity';
import { OfficeHub } from './entities/office-hub.entity';
import { Certificate } from './entities/certificate.entity';
import { ComplianceDocument } from './entities/compliance-document.entity';
import { SettingsService } from './settings.service';
import { SettingsController } from './settings.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      CompanySetting,
      OfficeHub,
      Certificate,
      ComplianceDocument,
    ]),
  ],
  controllers: [SettingsController],
  providers: [SettingsService],
  exports: [SettingsService],
})
export class SettingsModule {}

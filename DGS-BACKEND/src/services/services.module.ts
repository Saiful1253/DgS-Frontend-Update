import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Service } from './entities/service.entity';
import { ServiceGroup } from './entities/service-group.entity';
import { ServicePillar } from './entities/service-pillar.entity';
import { WhyChooseUs } from './entities/why-choose-us.entity';
import { ServicesService } from './services.service';
import { ServicesController } from './services.controller';
import { WhyChooseUsService } from './why-choose-us.service';
import { WhyChooseUsController } from './why-choose-us.controller';

import { SiteSetting } from '../site-settings/entities/site-setting.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Service,
      ServiceGroup,
      ServicePillar,
      WhyChooseUs,
      SiteSetting,
    ]),
  ],
  controllers: [WhyChooseUsController, ServicesController],
  providers: [WhyChooseUsService, ServicesService],
  exports: [WhyChooseUsService, ServicesService],
})
export class ServicesModule {}

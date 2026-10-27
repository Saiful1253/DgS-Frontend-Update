import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { WhatWeDo } from './entities/what-we-do.entity';
import { WhatWeDoController } from './whatwedo.controller';
import { WhatWeDoService } from './whatwedo.service';

@Module({
  imports: [TypeOrmModule.forFeature([WhatWeDo])],
  controllers: [WhatWeDoController],
  providers: [WhatWeDoService],
  exports: [WhatWeDoService],
})
export class WhatWeDoModule {}

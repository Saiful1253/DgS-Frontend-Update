import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Technology } from '../settings/entities/technology.entity';
import { TechnologyCategory } from './entities/technology-category.entity';
import { TechnologiesController } from './technologies.controller';
import { TechnologiesService } from './technologies.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Technology,
      TechnologyCategory,
    ]),
  ],
  controllers: [TechnologiesController],
  providers: [TechnologiesService],
  exports: [TechnologiesService],
})
export class TechnologiesModule {}

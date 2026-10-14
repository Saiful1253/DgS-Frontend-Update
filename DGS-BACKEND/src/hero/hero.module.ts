import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { HeroController } from './hero.controller';
import { HeroService } from './hero.service';
import { HeroSection } from './entities/hero-section.entity';
import { HeroMedia } from './entities/hero-media.entity';

@Module({
  imports: [TypeOrmModule.forFeature([HeroSection, HeroMedia])],
  controllers: [HeroController],
  providers: [HeroService],
  exports: [HeroService],
})
export class HeroModule {}

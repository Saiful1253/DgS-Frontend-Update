import { Module } from '@nestjs/common';
import { HeroModule } from '../hero/hero.module';
import { BlogsModule } from '../blogs/blogs.module';
import { PortfolioModule } from '../portfolio/portfolio.module';
import { SettingsModule } from '../settings/settings.module';
import { TestimonialsModule } from '../testimonials/testimonials.module';
import { PartnersModule } from '../partners/partners.module';
import { CareersModule } from '../careers/careers.module';
import { ClientLogosModule } from '../client-logos/client-logos.module';
import { PricingModule } from '../pricing/pricing.module';
import { SiteSettingsModule } from '../site-settings/site-settings.module';
import { ClientController } from './client.controller';

@Module({
  imports: [
    HeroModule,
    BlogsModule,
    SettingsModule,
    SiteSettingsModule,
    PortfolioModule,
    TestimonialsModule,
    PartnersModule,
    CareersModule,
    ClientLogosModule,
    PricingModule,
  ],
  controllers: [ClientController],
})
export class ClientModule {}
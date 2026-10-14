import { Module } from '@nestjs/common';
import { HeroModule } from '../hero/hero.module';
import { BlogsModule } from '../blogs/blogs.module';
import { PortfolioModule } from '../portfolio/portfolio.module';
import { SettingsModule } from '../settings/settings.module';
import { TestimonialsModule } from '../testimonials/testimonials.module';
import { PartnersModule } from '../partners/partners.module';
import { CareersModule } from '../careers/careers.module';
import { ProductsModule } from '../products/products.module';
import { ClientLogosModule } from '../client-logos/client-logos.module';
import { PricingModule } from '../pricing/pricing.module';
import { ClientController } from './client.controller';

@Module({
  imports: [
    HeroModule,
    BlogsModule,
    SettingsModule,
    PortfolioModule,
    TestimonialsModule,
    PartnersModule,
    CareersModule,
    // The storefront serves the `products` entity, not `products-saas` - its
    // pages read images / seo_meta / category / brand / pricing, which only
    // `products` has.
    ProductsModule,
    ClientLogosModule,
    PricingModule,
  ],
  controllers: [ClientController],
})
export class ClientModule {}
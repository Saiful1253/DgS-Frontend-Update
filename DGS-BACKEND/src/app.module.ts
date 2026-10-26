import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ThrottlerModule } from '@nestjs/throttler';
import { ScheduleModule } from '@nestjs/schedule';
import { dataSourceOptions } from './database/data-source';
import { AuthModule } from './auth/auth.module';
import { JwtAuthGuard } from './auth/guards/jwt-auth.guard';
import { UsersModule } from './users/users.module';
import { RolesModule } from './roles/roles.module';
import { HeroModule } from './hero/hero.module';
import { BlogsModule } from './blogs/blogs.module';
import { TagsModule } from './tags/tags.module';
import { SiteSettingsModule } from './site-settings/site-settings.module';
import { DashboardModule } from './dashboard/dashboard.module';
import { UploadModule } from './upload/upload.module';
import { NotificationModule } from './notification/notification.module';
import { PortfolioModule } from './portfolio/portfolio.module';
import { CareersModule } from './careers/careers.module';
import { LeadsModule } from './leads/leads.module';
import { SettingsModule } from './settings/settings.module';
import { SeoModule } from './seo/seo.module';
import { TestimonialsModule } from './testimonials/testimonials.module';
import { PartnersModule } from './partners/partners.module';
import { ClientModule } from './client/client.module';
import { ClientLogosModule } from './client-logos/client-logos.module';
import { PricingModule } from './pricing/pricing.module';
import { MailModule } from './common/mail/mail.module';
import { ServicesModule } from './services/services.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true, envFilePath: ['.env', 'ITALY-PORTFOLIO-BACKED/.env'] }),
    TypeOrmModule.forRoot({
      ...dataSourceOptions,
      autoLoadEntities: true,
    }),
    ThrottlerModule.forRoot([
      {
        ttl: 60000,
        limit: 100,
      },
    ]),
    ScheduleModule.forRoot(),
    AuthModule,
    UsersModule,
    RolesModule,
    HeroModule,
    BlogsModule,
    TagsModule,
    SiteSettingsModule,
    DashboardModule,
    UploadModule,
    NotificationModule,
    PortfolioModule,
    CareersModule,
    LeadsModule,
    SettingsModule,
    SeoModule,
    TestimonialsModule,
    PartnersModule,
    ClientModule,
    ClientLogosModule,
    PricingModule,
    MailModule,
    ServicesModule,
  ],
  providers: [
    { provide: APP_GUARD, useClass: JwtAuthGuard },
  ],
})
export class AppModule {}

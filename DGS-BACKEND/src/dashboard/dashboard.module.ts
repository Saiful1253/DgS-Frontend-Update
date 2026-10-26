import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DashboardController } from './dashboard.controller';
import { DashboardService } from './dashboard.service';
import { User } from '../users/user.entity';
import { Lead } from '../leads/entities/lead.entity';
import { Job } from '../careers/entities/job.entity';
import { JobApplicant } from '../careers/entities/job-applicant.entity';
import { Blog } from '../blogs/entities/blog.entity';
import { Portfolio } from '../portfolio/entities/portfolio.entity';
import { Service } from '../services/entities/service.entity';
import { Testimonial } from '../testimonials/entities/testimonial.entity';
import { Partner } from '../partners/entities/partner.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      User,
      Lead,
      Job,
      JobApplicant,
      Blog,
      Portfolio,
      Service,
      Testimonial,
      Partner,
    ]),
  ],
  controllers: [DashboardController],
  providers: [DashboardService],
})
export class DashboardModule {}
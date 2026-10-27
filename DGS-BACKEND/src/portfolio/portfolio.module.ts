import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Portfolio } from './entities/portfolio.entity';
import { PortfolioChallenge } from './entities/portfolio-challenge.entity';
import { PortfolioPricingTier } from './entities/portfolio-pricing-tier.entity';
import { PortfolioCategory } from './entities/portfolio-category.entity';
import { PortfolioArea } from './entities/portfolio-area.entity';
import { PortfolioService } from './portfolio.service';
import { PortfolioController } from './portfolio.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Portfolio,
      PortfolioChallenge,
      PortfolioPricingTier,
      PortfolioCategory,
      PortfolioArea,
    ]),
  ],
  controllers: [PortfolioController],
  providers: [PortfolioService],
  exports: [PortfolioService],
})
export class PortfolioModule {}

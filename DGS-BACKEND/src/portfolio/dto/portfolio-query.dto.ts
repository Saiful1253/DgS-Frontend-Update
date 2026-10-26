import { IsEnum, IsOptional, IsString, MaxLength } from 'class-validator';
import { PaginationQueryDto } from '../../common/dto/pagination-query.dto';
import { PortfolioProjectStatus, PortfolioProjectType } from '../entities/portfolio.entity';

export class PortfolioQueryDto extends PaginationQueryDto {
  @IsOptional()
  @IsString()
  @MaxLength(100)
  category?: string;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  search?: string;

  @IsOptional()
  @IsString()
  featured?: string;

  @IsOptional()
  @IsEnum(PortfolioProjectStatus)
  status?: PortfolioProjectStatus;

  @IsOptional()
  @IsString()
  projectType?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  district?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  area?: string;
}

import { IsOptional, IsString, Matches, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class MetricItemDto {
  @ApiPropertyOptional({ example: '500+' })
  @IsOptional()
  @IsString()
  @Matches(/^[^-]*$/, { message: 'Metric value cannot be negative. Only positive values or 0 are allowed.' })
  value?: string;

  @ApiPropertyOptional({ example: 'Completed Projects' })
  @IsOptional()
  @IsString()
  label?: string;

  @ApiPropertyOptional({ example: 'Residential, Commercial & Industrial' })
  @IsOptional()
  @IsString()
  subtitle?: string;
}

export class UpdateWhyChooseUsMetricsDto {
  @ApiPropertyOptional({ type: MetricItemDto })
  @IsOptional()
  @ValidateNested()
  @Type(() => MetricItemDto)
  metric1?: MetricItemDto;

  @ApiPropertyOptional({ type: MetricItemDto })
  @IsOptional()
  @ValidateNested()
  @Type(() => MetricItemDto)
  metric2?: MetricItemDto;

  @ApiPropertyOptional({ type: MetricItemDto })
  @IsOptional()
  @ValidateNested()
  @Type(() => MetricItemDto)
  metric3?: MetricItemDto;

  @ApiPropertyOptional({ type: MetricItemDto })
  @IsOptional()
  @ValidateNested()
  @Type(() => MetricItemDto)
  metric4?: MetricItemDto;
}

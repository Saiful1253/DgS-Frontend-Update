import { IsOptional, IsString, MaxLength } from 'class-validator';

export class ProductSaasQueryDto {
  @IsOptional()
  @IsString()
  @MaxLength(100)
  industry?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  category?: string;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  search?: string;
}

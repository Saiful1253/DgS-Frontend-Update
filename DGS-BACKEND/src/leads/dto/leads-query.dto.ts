import { IsIn, IsOptional, IsString, MaxLength } from 'class-validator';

export class LeadsQueryDto {
  @IsOptional()
  @IsString()
  @MaxLength(50)
  type?: string;

  @IsOptional()
  @IsString()
  @MaxLength(50)
  status?: string;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  search?: string;
}

export class LeadExportQueryDto extends LeadsQueryDto {
  @IsOptional()
  @IsIn(['xlsx', 'csv'])
  format?: string;
}

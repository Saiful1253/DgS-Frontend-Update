import { Type } from 'class-transformer';
import {
  IsArray,
  IsDefined,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  ValidateNested,
} from 'class-validator';
import { CreateLeadDto } from './create-lead.dto';

export class TrialAssetDto {
  @IsString()
  @IsNotEmpty()
  file_name: string;

  @IsString()
  @IsNotEmpty()
  original_name: string;

  @IsString()
  @IsNotEmpty()
  file_path: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  file_size?: number;

  @IsOptional()
  @IsString()
  file_type?: string;
}

export class CreateFreeTrialDto {
  @IsDefined()
  @ValidateNested()
  @Type(() => CreateLeadDto)
  lead: CreateLeadDto;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => TrialAssetDto)
  assets?: TrialAssetDto[];
}

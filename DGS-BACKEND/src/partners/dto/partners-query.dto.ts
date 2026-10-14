import { IsOptional, IsString, MaxLength } from 'class-validator';

export class PartnersQueryDto {
  @IsOptional() @IsString() @MaxLength(100)
  sector?: string;
}

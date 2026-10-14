import { Type } from 'class-transformer';
import { IsInt, IsNotEmpty, IsOptional, IsString, MaxLength } from 'class-validator';
import { IsLooseNumber } from '../../common/validators/is-loose-number.validator';

/** Public job-application payload (website form + RecaptchaGuard). Kept permissive. */
export class CreateJobApplicantDto {
  @Type(() => Number) @IsInt()
  job_id: number;

  @IsOptional() @IsString() @MaxLength(100)
  source_channel?: string;

  @IsString() @IsNotEmpty() @MaxLength(255)
  full_name: string;

  @IsString() @IsNotEmpty() @MaxLength(255)
  email: string;

  @IsOptional() @IsString() @MaxLength(50)
  mobile_prefix?: string;

  @IsOptional() @IsString() @MaxLength(50)
  mobile_number?: string;

  @IsOptional() @IsString() @MaxLength(255)
  current_company?: string;

  @IsOptional() @IsString() @MaxLength(255)
  designation?: string;

  @IsOptional() @IsString() @MaxLength(500)
  linkedin_url?: string;

  @IsString() @IsNotEmpty() @MaxLength(500)
  resume_url: string;

  @IsOptional() @IsString()
  cover_letter?: string;

  @IsOptional()
  @IsLooseNumber()
  experience_years?: string | number;

  @IsOptional() @IsString() @MaxLength(100)
  status?: string;
}

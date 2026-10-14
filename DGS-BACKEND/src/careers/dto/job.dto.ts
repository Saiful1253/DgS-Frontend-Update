import { IsDateString, IsNotEmpty, IsOptional, IsString, MaxLength } from 'class-validator';

export class CreateJobDto {
  @IsString() @IsNotEmpty() @MaxLength(255)
  title: string;

  @IsString() @IsNotEmpty() @MaxLength(100)
  employment_type: string;

  @IsString() @IsNotEmpty() @MaxLength(100)
  department: string;

  @IsString() @IsNotEmpty() @MaxLength(100)
  location: string;

  @IsOptional() @IsDateString()
  deadline?: string;

  @IsString() @IsNotEmpty()
  description_requirements: string;

  @IsOptional() @IsString() @MaxLength(50)
  status?: string;
}

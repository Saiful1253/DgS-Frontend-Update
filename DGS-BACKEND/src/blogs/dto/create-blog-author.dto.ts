import { IsString, IsNotEmpty, IsOptional, MaxLength } from 'class-validator';

export class CreateBlogAuthorDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  name: string;

  @IsString()
  @IsOptional()
  @MaxLength(255)
  designation?: string;

  @IsString()
  @IsOptional()
  bio?: string;

  @IsString()
  @IsOptional()
  @MaxLength(500)
  linkedin_url?: string;
}

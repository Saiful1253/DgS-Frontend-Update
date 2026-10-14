import { IsNotEmpty, IsOptional, IsIn, IsDateString } from 'class-validator';
import { BLOG_STATUSES, BlogStatus } from './create-blog.dto';

export class ChangeBlogStatusDto {
  @IsIn([...BLOG_STATUSES])
  @IsNotEmpty()
  status: BlogStatus;

  @IsDateString()
  @IsOptional()
  publish_at?: string;
}

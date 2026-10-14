import { PartialType } from '@nestjs/swagger';
import { CreateJobDto } from './job.dto';

export class UpdateJobDto extends PartialType(CreateJobDto) {}

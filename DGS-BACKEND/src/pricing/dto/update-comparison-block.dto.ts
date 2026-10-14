import { PartialType } from '@nestjs/swagger';
import { UpsertComparisonBlockDto } from './comparison-block.dto';

export class UpdateComparisonBlockDto extends PartialType(UpsertComparisonBlockDto) {}

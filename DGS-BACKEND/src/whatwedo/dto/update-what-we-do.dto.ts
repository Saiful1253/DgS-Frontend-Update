import { PartialType } from '@nestjs/swagger';
import { CreateWhatWeDoDto } from './create-what-we-do.dto';

export class UpdateWhatWeDoDto extends PartialType(CreateWhatWeDoDto) {}

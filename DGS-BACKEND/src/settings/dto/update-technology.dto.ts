import { PartialType } from '@nestjs/swagger';
import { CreateTechnologyDto } from './technology.dto';

export class UpdateTechnologyDto extends PartialType(CreateTechnologyDto) {}

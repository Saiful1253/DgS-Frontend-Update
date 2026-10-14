import { PartialType } from '@nestjs/swagger';
import { CreateServicePillarDto } from './create-service-pillar.dto';

export class UpdateServicePillarDto extends PartialType(CreateServicePillarDto) {}

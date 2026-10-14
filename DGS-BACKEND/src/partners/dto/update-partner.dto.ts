import { PartialType } from '@nestjs/swagger';
import { CreatePartnerDto } from './partner.dto';

export class UpdatePartnerDto extends PartialType(CreatePartnerDto) {}

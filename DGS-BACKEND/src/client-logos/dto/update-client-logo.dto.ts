import { PartialType } from '@nestjs/swagger';
import { CreateClientLogoDto } from './client-logo.dto';

export class UpdateClientLogoDto extends PartialType(CreateClientLogoDto) {}

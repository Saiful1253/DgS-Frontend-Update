import { PartialType } from '@nestjs/swagger';
import { CreateOfficeHubDto } from './office-hub.dto';

export class UpdateOfficeHubDto extends PartialType(CreateOfficeHubDto) {}

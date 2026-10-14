import { PartialType } from '@nestjs/swagger';
import { CreateCertificateDto } from './certificate.dto';

export class UpdateCertificateDto extends PartialType(CreateCertificateDto) {}

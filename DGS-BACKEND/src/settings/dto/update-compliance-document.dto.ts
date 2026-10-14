import { PartialType } from '@nestjs/swagger';
import { CreateComplianceDocumentDto } from './compliance-document.dto';

export class UpdateComplianceDocumentDto extends PartialType(CreateComplianceDocumentDto) {}

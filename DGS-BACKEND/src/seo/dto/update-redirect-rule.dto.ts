import { PartialType } from '@nestjs/swagger';
import { CreateRedirectRuleDto } from './redirect-rule.dto';

export class UpdateRedirectRuleDto extends PartialType(CreateRedirectRuleDto) {}

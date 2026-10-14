import { IsBoolean, IsDefined } from 'class-validator';

export class ToggleServiceStatusDto {
  @IsDefined()
  @IsBoolean()
  is_active: boolean;
}

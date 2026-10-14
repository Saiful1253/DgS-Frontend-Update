import { Type } from 'class-transformer';
import { ArrayMinSize, IsArray, IsInt, ValidateNested } from 'class-validator';

export class ClientLogoOrderItemDto {
  @Type(() => Number) @IsInt()
  id: number;

  @Type(() => Number) @IsInt()
  display_order: number;
}

export class ReorderClientLogosDto {
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => ClientLogoOrderItemDto)
  order: ClientLogoOrderItemDto[];
}

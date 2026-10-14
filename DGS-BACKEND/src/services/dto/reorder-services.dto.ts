import { Type } from 'class-transformer';
import { ArrayMinSize, IsArray, IsInt, Min, ValidateNested } from 'class-validator';

export class ServiceOrderItemDto {
  @Type(() => Number) @IsInt()
  @Min(1)
  id: number;

  // Without a floor, a negative order is accepted and sorts ahead of every
  // row the admin can drag, pushing it out of its own list.
  @Type(() => Number) @IsInt()
  @Min(0)
  display_order: number;
}

export class ReorderServicesDto {
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => ServiceOrderItemDto)
  order: ServiceOrderItemDto[];
}

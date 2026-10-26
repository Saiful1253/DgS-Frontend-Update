import { IsArray, ValidateNested, IsInt, Min } from 'class-validator';
import { Type } from 'class-transformer';

export class ReorderItemDto {
  @IsInt()
  id: number;

  @IsInt()
  @Min(0)
  display_order: number;
}

export class ReorderWhyChooseUsDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ReorderItemDto)
  order: ReorderItemDto[];
}

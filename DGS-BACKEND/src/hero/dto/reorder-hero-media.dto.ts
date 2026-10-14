import { IsArray, IsInt, Min, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

export class HeroMediaOrderItemDto {
  @Type(() => Number)
  @IsInt()
  @Min(1)
  id: number;

  @Type(() => Number)
  @IsInt()
  @Min(0)
  sort_order: number;
}

export class ReorderHeroMediaDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => HeroMediaOrderItemDto)
  order: HeroMediaOrderItemDto[];
}

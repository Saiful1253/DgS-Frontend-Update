import { ApiProperty } from '@nestjs/swagger';
import { ArrayMaxSize, ArrayMinSize, IsArray, IsInt, Min, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

export class ReorderTechnologyItemDto {
  @ApiProperty({ example: 1 })
  @IsInt({ message: 'Each reorder entry needs a numeric id' })
  @Min(1, { message: 'Each reorder entry needs a positive id' })
  id!: number;

  @ApiProperty({ example: 0 })
  @IsInt({ message: 'display_order must be an integer' })
  @Min(0, { message: 'display_order cannot be negative' })
  display_order!: number;
}

export class ReorderTechnologiesDto {
  @ApiProperty({ type: [ReorderTechnologyItemDto] })
  @IsArray({ message: 'order must be an array' })
  @ArrayMinSize(1, { message: 'order must contain at least one entry' })
  @ArrayMaxSize(500, { message: 'order cannot contain more than 500 entries' })
  @ValidateNested({ each: true })
  @Type(() => ReorderTechnologyItemDto)
  order!: ReorderTechnologyItemDto[];
}

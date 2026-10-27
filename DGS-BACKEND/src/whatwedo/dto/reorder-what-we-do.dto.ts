import {
  ArrayMinSize,
  ArrayUnique,
  IsArray,
  IsInt,
  IsNotEmpty,
  IsString,
  Min,
} from 'class-validator';

export class ReorderWhatWeDoDto {
  @IsString()
  @IsNotEmpty()
  category: string;

  @IsArray()
  @ArrayMinSize(1)
  @ArrayUnique()
  @IsInt({ each: true })
  ids: number[];

  @IsInt()
  @Min(0)
  offset: number;
}

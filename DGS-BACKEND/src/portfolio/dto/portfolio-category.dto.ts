import { IsNotEmpty, IsString, MaxLength } from 'class-validator';

export class CreatePortfolioCategoryDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  name: string;
}

export class UpdatePortfolioCategoryDto extends CreatePortfolioCategoryDto {}

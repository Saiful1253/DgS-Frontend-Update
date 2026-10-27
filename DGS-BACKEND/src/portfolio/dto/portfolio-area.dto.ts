import { IsNotEmpty, IsString, MaxLength } from 'class-validator';

export class CreatePortfolioAreaDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  name: string;
}

export class UpdatePortfolioAreaDto extends CreatePortfolioAreaDto {}

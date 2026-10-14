import { IsNotEmpty, IsString, MaxLength } from 'class-validator';

export class RedirectLookupQueryDto {
  @IsString() @IsNotEmpty() @MaxLength(255)
  path: string;
}

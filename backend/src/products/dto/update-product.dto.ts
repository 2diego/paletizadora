import {
  IsString,
  IsInt,
  Min,
  Length,
  IsOptional,
  IsBoolean,
  MaxLength,
} from 'class-validator';

export class UpdateProductDto {
  @IsOptional()
  @IsString()
  @Length(1, 100)
  codigo?: string;

  @IsOptional()
  @IsInt()
  @Min(0)
  filas?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  camadas?: number;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  detalle?: string | null;

  @IsOptional()
  @IsBoolean()
  activo?: boolean;
}

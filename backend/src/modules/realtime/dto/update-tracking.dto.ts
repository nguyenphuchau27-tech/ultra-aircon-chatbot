import { Type } from 'class-transformer';
import { IsLatitude, IsLongitude, IsNumber, Min } from 'class-validator';

export class UpdateTrackingDto {
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  techId: number;

  @Type(() => Number)
  @IsLatitude()
  latitude: number;

  @Type(() => Number)
  @IsLongitude()
  longitude: number;
}
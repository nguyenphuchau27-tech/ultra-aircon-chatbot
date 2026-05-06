import { IsIn } from 'class-validator';

export class UpdateOrderStatusDto {
  @IsIn(['pending', 'assigned', 'in_progress', 'completed', 'cancelled'])
  status: string;
}




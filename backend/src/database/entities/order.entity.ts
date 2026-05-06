import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  Index,
  CreateDateColumn,
} from 'typeorm';

import { User } from './user.entity';
import { Technician } from './technician.entity';

@Entity()
@Index(['customerId'])
@Index(['technicianId'])
@Index(['status'])
@Index(['serviceType'])
@Index(['createdAt'])
@Index(['customerId', 'status'])
@Index(['technicianId', 'status'])
export class Order {
  @PrimaryGeneratedColumn()
  id: number;

  // customer
  @Column()
  customerId: number;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'customerId' })
  customer: User;

  // technician
  @Column({ nullable: true })
  technicianId: number | null;

  @ManyToOne(() => Technician, { nullable: true })
  @JoinColumn({ name: 'technicianId' })
  technician: Technician | null;

  // service
  @Column()
  serviceType: string;

  // location
  @Column()
  address: string;

  @Column('float', { nullable: true })
  lat: number | null;

  @Column('float', { nullable: true })
  lng: number | null;

  // price
  @Column('decimal', { nullable: true, precision: 10, scale: 2 })
  price: number | null;

  // status
  @Column({ default: 'pending' })
  status: string;

  // created time
  @CreateDateColumn({
    type: 'timestamp',
    default: () => 'CURRENT_TIMESTAMP',
  })
  createdAt: Date;
}
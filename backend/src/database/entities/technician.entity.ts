import { Entity, PrimaryGeneratedColumn, Column, Index } from 'typeorm';

@Entity()
@Index(['skill'])
@Index(['isAvailable'])
@Index(['latitude', 'longitude'])
@Index(['rating'])
export class Technician {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ nullable: true, unique: true })
  userId?: number;

  @Column()
  name: string;

  @Column({ unique: true })
  phone: string;

  @Column({ default: 'aircon' })
  skill: string;

  @Column('float')
  latitude: number;

  @Column('float')
  longitude: number;

  @Column('float', { default: 5 })
  rating: number;

  @Column({ default: true })
  isAvailable: boolean;
}

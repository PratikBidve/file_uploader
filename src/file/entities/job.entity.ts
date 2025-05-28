import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne } from 'typeorm';
import { File } from './file.entity';

@Entity('jobs')
export class Job {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => File, file => file.jobs)
  file: File;

  @Column()
  job_type: string;

  @Column({
    type: 'enum',
    enum: ['queued', 'processing', 'completed', 'failed'],
    default: 'queued'
  })
  status: string;

  @Column({ nullable: true, type: 'text' })
  error_message: string;

  @Column({ nullable: true })
  started_at: Date;

  @Column({ nullable: true })
  completed_at: Date;
} 
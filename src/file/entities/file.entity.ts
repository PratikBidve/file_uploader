import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, OneToMany } from 'typeorm';
import { User } from '../../user/entities/user.entity';
import { Job } from './job.entity';

@Entity('files')
export class File {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => User, user => user.files)
  user: User;

  @Column()
  original_filename: string;

  @Column()
  storage_path: string;

  @Column({ nullable: true })
  title: string;

  @Column({ nullable: true, type: 'text' })
  description: string;

  @Column({
    type: 'enum',
    enum: ['uploaded', 'processing', 'processed', 'failed'],
    default: 'uploaded'
  })
  status: string;

  @Column({ nullable: true, type: 'text' })
  extracted_data: string;

  @CreateDateColumn()
  uploaded_at: Date;

  @OneToMany(() => Job, job => job.file)
  jobs: Job[];
} 
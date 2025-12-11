import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  Unique,
} from 'typeorm';
import { Enrollment } from './enrollment.entity';
import { Module } from './module.entity';

@Entity('progress')
@Unique(['enrollmentId', 'moduleId'])
export class Progress {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Enrollment, (enrollment) => enrollment.progress)
  @JoinColumn({ name: 'enrollmentId' })
  enrollment: Enrollment;

  @Column()
  enrollmentId: string;

  @ManyToOne(() => Module)
  @JoinColumn({ name: 'moduleId' })
  module: Module;

  @Column()
  moduleId: string;

  @Column({ default: false })
  isCompleted: boolean;

  @Column({ type: 'float', default: 0 })
  completionPercentage: number;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}



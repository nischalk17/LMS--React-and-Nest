import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Course } from './course.entity';

export enum ModuleType {
  TEXT = 'text',
  VIDEO = 'video',
  PDF = 'pdf',
}

@Entity('modules')
export class Module {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  title: string;

  @Column('text', { nullable: true })
  content: string;

  @Column({
    type: 'enum',
    enum: ModuleType,
    default: ModuleType.TEXT,
  })
  type: ModuleType;

  @Column({ nullable: true })
  videoUrl: string;

  @Column({ nullable: true })
  pdfUrl: string;

  @Column({ default: 0 })
  order: number;

  @ManyToOne(() => Course, (course) => course.modules, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'courseId' })
  course: Course;

  @Column()
  courseId: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}



import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToOne,
  OneToMany,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { Course } from './course.entity';
import { User } from './user.entity';

/** One multiple-choice quiz per course. */
@Entity('quizzes')
export class Quiz {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @OneToOne(() => Course, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'courseId' })
  course: Course;

  @Column({ unique: true })
  courseId: string;

  @Column()
  title: string;

  /** Percentage (0-100) needed to pass. */
  @Column({ type: 'int', default: 70 })
  passingScore: number;

  @OneToMany(() => QuizQuestion, (q) => q.quiz, { cascade: true })
  questions: QuizQuestion[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}

@Entity('quiz_questions')
export class QuizQuestion {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Quiz, (quiz) => quiz.questions, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'quizId' })
  quiz: Quiz;

  @Column()
  quizId: string;

  @Column('text')
  text: string;

  @Column('jsonb')
  options: string[];

  @Column({ type: 'int' })
  correctIndex: number;

  /** Topic this question tests; the unit knowledge tracing reports mastery on. */
  @Column({ type: 'varchar', length: 80, nullable: true })
  skill: string | null;

  @Column({ type: 'int', default: 0 })
  order: number;
}

@Entity('quiz_attempts')
export class QuizAttempt {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Quiz, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'quizId' })
  quiz: Quiz;

  @Column()
  quizId: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'studentId' })
  student: User;

  @Column()
  studentId: string;

  /** Percentage 0-100. */
  @Column({ type: 'int' })
  score: number;

  @Column()
  passed: boolean;

  @CreateDateColumn()
  createdAt: Date;
}

/**
 * One row per answered question. This is the training/inference data for
 * knowledge tracing. The skill is copied here so history survives quiz edits,
 * and questionId becomes NULL (not deleted) if the question is later removed.
 */
@Entity('quiz_responses')
@Index(['studentId', 'createdAt'])
export class QuizResponse {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => QuizAttempt, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'attemptId' })
  attempt: QuizAttempt;

  @Column()
  attemptId: string;

  @ManyToOne(() => Quiz, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'quizId' })
  quiz: Quiz;

  @Column()
  quizId: string;

  @ManyToOne(() => QuizQuestion, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'questionId' })
  question: QuizQuestion | null;

  @Column({ type: 'uuid', nullable: true })
  questionId: string | null;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'studentId' })
  student: User;

  @Column()
  studentId: string;

  @Column({ type: 'varchar', length: 80 })
  skill: string;

  @Column({ type: 'int' })
  selectedIndex: number;

  @Column()
  correct: boolean;

  @CreateDateColumn()
  createdAt: Date;
}

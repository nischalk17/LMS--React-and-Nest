import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ProgressService } from './progress.service';
import { ProgressController } from './progress.controller';
import { Progress } from '../entities/progress.entity';
import { Enrollment } from '../entities/enrollment.entity';
import { Module as ModuleEntity } from '../entities/module.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Progress, Enrollment, ModuleEntity])],
  controllers: [ProgressController],
  providers: [ProgressService],
})
export class ProgressModule {}

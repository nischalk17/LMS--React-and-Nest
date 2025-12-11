import {
  Controller,
  Get,
  Patch,
  Param,
  Body,
  UseGuards,
  Request,
} from '@nestjs/common';
import { ProgressService } from './progress.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('progress')
@UseGuards(JwtAuthGuard)
export class ProgressController {
  constructor(private readonly progressService: ProgressService) {}

  @Patch(':enrollmentId/modules/:moduleId')
  updateProgress(
    @Param('enrollmentId') enrollmentId: string,
    @Param('moduleId') moduleId: string,
    @Body('completionPercentage') completionPercentage: number,
    @Request() req,
  ) {
    return this.progressService.updateProgress(
      enrollmentId,
      moduleId,
      completionPercentage,
      req.user.id,
    );
  }

  @Get(':enrollmentId/modules/:moduleId')
  getModuleProgress(
    @Param('enrollmentId') enrollmentId: string,
    @Param('moduleId') moduleId: string,
    @Request() req,
  ) {
    return this.progressService.getModuleProgress(
      enrollmentId,
      moduleId,
      req.user.id,
    );
  }
}



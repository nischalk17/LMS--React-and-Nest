import {
  Controller,
  Get,
  Patch,
  Param,
  Body,
  ParseUUIDPipe,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { ProgressService } from './progress.service';
import { UpdateProgressDto } from './dto/update-progress.dto';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { AuthUser } from '../auth/decorators/current-user.decorator';

@ApiTags('progress')
@ApiBearerAuth()
@Controller('progress')
export class ProgressController {
  constructor(private readonly progressService: ProgressService) {}

  @Patch(':enrollmentId/modules/:moduleId')
  updateProgress(
    @Param('enrollmentId', ParseUUIDPipe) enrollmentId: string,
    @Param('moduleId', ParseUUIDPipe) moduleId: string,
    @Body() dto: UpdateProgressDto,
    @CurrentUser() user: AuthUser,
  ) {
    return this.progressService.updateProgress(
      enrollmentId,
      moduleId,
      dto.completionPercentage,
      user.id,
    );
  }

  @Get(':enrollmentId/modules/:moduleId')
  getModuleProgress(
    @Param('enrollmentId', ParseUUIDPipe) enrollmentId: string,
    @Param('moduleId', ParseUUIDPipe) moduleId: string,
    @CurrentUser() user: AuthUser,
  ) {
    return this.progressService.getModuleProgress(
      enrollmentId,
      moduleId,
      user.id,
    );
  }
}

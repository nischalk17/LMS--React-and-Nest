import { Controller, Get, Post, Param, ParseUUIDPipe } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { EnrollmentsService } from './enrollments.service';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { AuthUser } from '../auth/decorators/current-user.decorator';

@ApiTags('enrollments')
@ApiBearerAuth()
@Controller('enrollments')
export class EnrollmentsController {
  constructor(private readonly enrollmentsService: EnrollmentsService) {}

  @Post('courses/:courseId')
  enroll(
    @Param('courseId', ParseUUIDPipe) courseId: string,
    @CurrentUser() user: AuthUser,
  ) {
    return this.enrollmentsService.enroll(user.id, courseId);
  }

  @Get('my-courses')
  getMyEnrollments(@CurrentUser() user: AuthUser) {
    return this.enrollmentsService.getStudentEnrollments(user.id);
  }

  @Get(':id/progress')
  getProgress(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: AuthUser,
  ) {
    return this.enrollmentsService.getEnrollmentProgress(id, user.id);
  }
}

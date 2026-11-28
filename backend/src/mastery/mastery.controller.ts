import {
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { MasteryService } from './mastery.service';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '../entities/user.entity';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { AuthUser } from '../auth/decorators/current-user.decorator';

@ApiTags('mastery')
@ApiBearerAuth()
@Controller('courses/:courseId/mastery')
@UseGuards(RolesGuard)
export class MasteryController {
  constructor(private readonly masteryService: MasteryService) {}

  /** The signed-in student's predicted mastery per skill in this course. */
  @Roles(UserRole.STUDENT)
  @Get('me')
  me(
    @Param('courseId', ParseUUIDPipe) courseId: string,
    @CurrentUser() user: AuthUser,
  ) {
    return this.masteryService.forStudent(courseId, user.id);
  }
}

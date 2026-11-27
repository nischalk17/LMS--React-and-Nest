import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Post,
  Put,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { QuizzesService } from './quizzes.service';
import { SubmitAttemptDto, UpsertQuizDto } from './dto/quiz.dto';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '../entities/user.entity';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { AuthUser } from '../auth/decorators/current-user.decorator';

@ApiTags('quizzes')
@ApiBearerAuth()
@Controller('courses/:courseId/quiz')
@UseGuards(RolesGuard)
export class QuizzesController {
  constructor(private readonly quizzesService: QuizzesService) {}

  @Get()
  get(
    @Param('courseId', ParseUUIDPipe) courseId: string,
    @CurrentUser() user: AuthUser,
  ) {
    return this.quizzesService.get(courseId, user);
  }

  @Roles(UserRole.INSTRUCTOR)
  @Put()
  upsert(
    @Param('courseId', ParseUUIDPipe) courseId: string,
    @Body() dto: UpsertQuizDto,
    @CurrentUser() user: AuthUser,
  ) {
    return this.quizzesService.upsert(courseId, dto, user);
  }

  @Roles(UserRole.INSTRUCTOR)
  @Delete()
  remove(
    @Param('courseId', ParseUUIDPipe) courseId: string,
    @CurrentUser() user: AuthUser,
  ) {
    return this.quizzesService.remove(courseId, user);
  }

  @Roles(UserRole.STUDENT)
  @Post('attempts')
  submit(
    @Param('courseId', ParseUUIDPipe) courseId: string,
    @Body() dto: SubmitAttemptDto,
    @CurrentUser() user: AuthUser,
  ) {
    return this.quizzesService.submit(courseId, dto.answers, user);
  }

  @Roles(UserRole.STUDENT)
  @Get('attempts/mine')
  mine(
    @Param('courseId', ParseUUIDPipe) courseId: string,
    @CurrentUser() user: AuthUser,
  ) {
    return this.quizzesService.myAttempts(courseId, user);
  }
}

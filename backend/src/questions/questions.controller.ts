import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { QuestionsService } from './questions.service';
import { AnswerQuestionDto, CreateQuestionDto } from './dto/question.dto';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { AuthUser } from '../auth/decorators/current-user.decorator';

@ApiTags('questions')
@ApiBearerAuth()
@Controller()
export class QuestionsController {
  constructor(private readonly questionsService: QuestionsService) {}

  @Get('courses/:courseId/questions')
  list(
    @Param('courseId', ParseUUIDPipe) courseId: string,
    @CurrentUser() user: AuthUser,
  ) {
    return this.questionsService.list(courseId, user);
  }

  @Post('courses/:courseId/questions')
  create(
    @Param('courseId', ParseUUIDPipe) courseId: string,
    @Body() dto: CreateQuestionDto,
    @CurrentUser() user: AuthUser,
  ) {
    return this.questionsService.create(courseId, dto.body, user);
  }

  @Patch('questions/:id/answer')
  answer(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: AnswerQuestionDto,
    @CurrentUser() user: AuthUser,
  ) {
    return this.questionsService.answer(id, dto.answer, user);
  }
}

import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  UseGuards,
  ParseUUIDPipe,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { CoursesService } from './courses.service';
import { CreateCourseDto } from './dto/create-course.dto';
import { UpdateCourseDto } from './dto/update-course.dto';
import { CreateModuleDto } from './dto/create-module.dto';
import { UpdateModuleDto } from './dto/update-module.dto';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '../entities/user.entity';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { AuthUser } from '../auth/decorators/current-user.decorator';

@ApiTags('courses')
@ApiBearerAuth()
@Controller('courses')
@UseGuards(RolesGuard)
export class CoursesController {
  constructor(private readonly coursesService: CoursesService) {}

  @Get()
  findAll(
    @CurrentUser() user: AuthUser,
    @Query('published') published?: string,
  ) {
    return this.coursesService.findAll(user, published === 'true');
  }

  @Get(':id')
  findOne(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: AuthUser,
  ) {
    return this.coursesService.findOne(id, user);
  }

  @Roles(UserRole.INSTRUCTOR)
  @Post()
  create(@Body() dto: CreateCourseDto, @CurrentUser() user: AuthUser) {
    return this.coursesService.create(dto, user.id);
  }

  @Roles(UserRole.INSTRUCTOR)
  @Patch(':id')
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateCourseDto,
    @CurrentUser() user: AuthUser,
  ) {
    return this.coursesService.update(id, dto, user.id);
  }

  @Roles(UserRole.INSTRUCTOR)
  @Delete(':id')
  remove(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: AuthUser,
  ) {
    return this.coursesService.remove(id, user.id);
  }

  @Roles(UserRole.INSTRUCTOR)
  @Post(':id/modules')
  addModule(
    @Param('id', ParseUUIDPipe) courseId: string,
    @Body() dto: CreateModuleDto,
    @CurrentUser() user: AuthUser,
  ) {
    return this.coursesService.addModule(courseId, dto, user.id);
  }

  @Roles(UserRole.INSTRUCTOR)
  @Patch('modules/:moduleId')
  updateModule(
    @Param('moduleId', ParseUUIDPipe) moduleId: string,
    @Body() dto: UpdateModuleDto,
    @CurrentUser() user: AuthUser,
  ) {
    return this.coursesService.updateModule(moduleId, dto, user.id);
  }

  @Roles(UserRole.INSTRUCTOR)
  @Delete('modules/:moduleId')
  removeModule(
    @Param('moduleId', ParseUUIDPipe) moduleId: string,
    @CurrentUser() user: AuthUser,
  ) {
    return this.coursesService.removeModule(moduleId, user.id);
  }
}

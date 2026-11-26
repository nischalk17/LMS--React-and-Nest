import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { AdminService } from './admin.service';
import { ListQueryDto, SetPublishedDto, UpdateRoleDto } from './dto/admin.dto';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '../entities/user.entity';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { AuthUser } from '../auth/decorators/current-user.decorator';

@ApiTags('admin')
@ApiBearerAuth()
@Controller('admin')
@UseGuards(RolesGuard)
@Roles(UserRole.ADMIN)
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  @Get('stats')
  stats() {
    return this.adminService.stats();
  }

  @Get('users')
  listUsers(@Query() query: ListQueryDto) {
    return this.adminService.listUsers(query);
  }

  @Patch('users/:id/role')
  setRole(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateRoleDto,
    @CurrentUser() admin: AuthUser,
  ) {
    return this.adminService.setRole(id, dto.role, admin.id);
  }

  @Delete('users/:id')
  removeUser(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() admin: AuthUser,
  ) {
    return this.adminService.removeUser(id, admin.id);
  }

  @Get('courses')
  listCourses(@Query() query: ListQueryDto) {
    return this.adminService.listCourses(query);
  }

  @Patch('courses/:id/published')
  setPublished(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: SetPublishedDto,
  ) {
    return this.adminService.setPublished(id, dto.isPublished);
  }

  @Delete('courses/:id')
  removeCourse(@Param('id', ParseUUIDPipe) id: string) {
    return this.adminService.removeCourse(id);
  }
}

import {
  Controller,
  Post,
  Body,
  UseGuards,
  Request,
  Get,
  Param,
  Patch,
  Delete,
  HttpCode,
  HttpStatus,
  Query,
} from '@nestjs/common';
import { EventsService } from './events.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { UserRole } from '../common/enums/user-role.enum';
import { CreateEventDto } from './dto/create-event.dto';
import { UpdateEventDto } from './dto/update-event.dto';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { EventStatus } from 'src/common/enums/event-status.enum';
import { RolesGuard } from 'src/common/guards/roles.guard';

@Controller('events')
@UseGuards(JwtAuthGuard, RolesGuard)
export class EventsController {
  constructor(private readonly eventsService: EventsService) {}

  @Roles(UserRole.HOST)
  @Post()
  async create(@CurrentUser() user, @Body() createEventDto: CreateEventDto) {
    return this.eventsService.createEvent(user, createEventDto);
  }

  @Roles(UserRole.HOST)
  @Get('mine')
  async getMyEvents(@CurrentUser() user) {
    return this.eventsService.findAllByHost(user.id);
  }

  @Get(':id')
  async getOne(@Param('id') id: string) {
    return this.eventsService.findOne(id);
  }

  @Roles(UserRole.HOST)
  @Patch(':id')
  async update(
    @Param('id') id: string,
    @CurrentUser() user,
    @Body() updateEventDto: UpdateEventDto,
  ) {
    return this.eventsService.updateEvent(id, user, updateEventDto);
  }

  @Roles(UserRole.HOST)
  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(@Param('id') id: string, @CurrentUser() user) {
    return this.eventsService.deleteEvent(id, user);
  }

  // (Optional) Endpoint to manually close an event

  @Roles(UserRole.HOST)
  @Patch(':id/close')
  async closeEvent(@Param('id') id: string, @CurrentUser() user) {
    return this.eventsService.updateEvent(id, user, {
      status: EventStatus.CLOSED,
    });
  }
}

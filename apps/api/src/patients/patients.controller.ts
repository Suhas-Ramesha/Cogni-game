import { Body, Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import { IsOptional, IsString } from 'class-validator';
import { AuthGuard } from '../auth/auth.guard';
import { CurrentUser } from '../auth/current-user';
import { AuthPrincipal } from '../auth/auth.service';
import { PatientsService } from './patients.service';

class PairDto {
  @IsString()
  pairingCode: string;

  @IsString()
  deviceId: string;

  @IsOptional()
  @IsString()
  platform?: string;
}

@Controller()
export class PatientsController {
  constructor(private readonly patients: PatientsService) {}

  @UseGuards(AuthGuard)
  @Get('patients')
  list(@CurrentUser() user: AuthPrincipal) {
    return this.patients.listFor(user);
  }

  @UseGuards(AuthGuard)
  @Get('patients/:id')
  detail(@Param('id') id: string, @CurrentUser() user: AuthPrincipal) {
    return this.patients.detail(id, user);
  }

  @Post('devices/pair')
  pair(@Body() body: PairDto) {
    return this.patients.pair(body.pairingCode, body.deviceId, body.platform ?? 'unknown');
  }
}

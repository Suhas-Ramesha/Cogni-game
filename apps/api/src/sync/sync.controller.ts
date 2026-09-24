import { Body, Controller, Post, UseGuards, Inject } from '@nestjs/common';
import { IsNumber, IsObject, IsOptional, IsString } from 'class-validator';
import { AuthGuard } from '../auth/auth.guard';
import { CurrentUser } from '../auth/current-user';
import { AuthPrincipal } from '../auth/auth.service';
import { SyncService } from './sync.service';
import type { SyncChanges } from '@cognigame/shared-types';

class PullDto {
  @IsOptional()
  @IsNumber()
  lastPulledAt?: number | null;

  @IsString()
  patientId: string;

  @IsString()
  deviceId: string;
}

class PushDto {
  @IsOptional()
  @IsNumber()
  lastPulledAt?: number | null;

  @IsString()
  patientId: string;

  @IsString()
  deviceId: string;

  @IsObject()
  changes: SyncChanges;
}

@Controller('sync')
@UseGuards(AuthGuard)
export class SyncController {
  constructor(@Inject(SyncService) private readonly sync: SyncService) {}

  @Post('pull')
  pull(@Body() body: PullDto, @CurrentUser() user: AuthPrincipal) {
    const patientId = user.role === 'patient' && user.patientId ? user.patientId : body.patientId;
    return this.sync.pull(patientId, body.lastPulledAt ?? null, body.deviceId);
  }

  @Post('push')
  push(@Body() body: PushDto, @CurrentUser() user: AuthPrincipal) {
    const patientId = user.role === 'patient' && user.patientId ? user.patientId : body.patientId;
    return this.sync.push(
      patientId,
      body.deviceId,
      body.changes,
      body.lastPulledAt ?? null,
      user.caregiverId,
    );
  }
}

import { Body, Controller, Post, Inject } from '@nestjs/common';
import { IsOptional, IsString } from 'class-validator';
import { AuthService } from './auth.service';

class PhoneLoginDto {
  @IsString()
  phone: string;
}

class PairLoginDto {
  @IsString()
  pairingCode: string;

  @IsString()
  deviceId: string;

  @IsOptional()
  @IsString()
  platform?: string;
}

class FirebaseLoginDto {
  @IsString()
  idToken: string;
}

@Controller('auth')
export class AuthController {
  constructor(@Inject(AuthService) private readonly auth: AuthService) {}

  @Post('phone')
  phone(@Body() body: PhoneLoginDto) {
    return this.auth.phoneLogin(body.phone);
  }

  @Post('pair')
  pair(@Body() body: PairLoginDto) {
    return this.auth.pairLogin(body);
  }

  @Post('firebase')
  firebase(@Body() body: FirebaseLoginDto) {
    return this.auth.firebaseLogin(body.idToken);
  }
}

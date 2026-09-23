import { Body, Controller, Post, Inject } from '@nestjs/common';
import { IsIn, IsOptional, IsString } from 'class-validator';
import { AuthService } from './auth.service';

class DemoLoginDto {
  @IsIn(['caregiver', 'patient'])
  role: 'caregiver' | 'patient';

  @IsOptional()
  @IsString()
  pairingCode?: string;

  @IsOptional()
  @IsString()
  phone?: string;
}

class FirebaseLoginDto {
  @IsString()
  idToken: string;
}

@Controller('auth')
export class AuthController {
  constructor(@Inject(AuthService) private readonly auth: AuthService) {}

  @Post('demo')
  demo(@Body() body: DemoLoginDto) {
    return this.auth.demoLogin(body);
  }

  @Post('firebase')
  async firebase(@Body() body: FirebaseLoginDto) {
    const principal = await this.auth.verify(body.idToken);
    return { token: this.auth.sign(principal), ...principal };
  }
}

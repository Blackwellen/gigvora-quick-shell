import { Body, Controller, Post } from '@nestjs/common';
import { IsEmail, MinLength } from 'class-validator';
import { AuthService } from './auth.service';

class SignupDto {
  @IsEmail() email!: string;
  @MinLength(8) password!: string;
  name!: string;
}
class LoginDto {
  @IsEmail() email!: string;
  @MinLength(8) password!: string;
}

@Controller('auth')
export class AuthController {
  constructor(private readonly auth: AuthService) {}

  @Post('signup') signup(@Body() dto: SignupDto) { return this.auth.signup(dto); }
  @Post('login')  login(@Body() dto: LoginDto)   { return this.auth.login(dto); }
  @Post('refresh') refresh(@Body() body: { refreshToken: string }) { return this.auth.refresh(body.refreshToken); }
  @Post('logout')  logout(@Body() body: { refreshToken: string })  { return this.auth.logout(body.refreshToken); }
}

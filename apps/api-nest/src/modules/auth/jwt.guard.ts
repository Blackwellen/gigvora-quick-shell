/**
 * JwtAuthGuard — thin re-export of Passport's JWT guard so module files have a
 * consistent import path (`../auth/jwt.guard`). The actual JWT validation
 * lives in `jwt.strategy.ts`.
 */
import { Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {}

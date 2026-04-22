/**
 * RolesGuard — enforces @AdminRoles() metadata against the request user's
 * `role` (set by JwtStrategy.validate). 403 if mismatched.
 *
 * The role hierarchy lives in the controllers themselves; this guard does a
 * straight membership test (any role in the list passes).
 */
import { CanActivate, ExecutionContext, ForbiddenException, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ADMIN_ROLES_KEY } from './roles.decorator';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(ctx: ExecutionContext): boolean {
    const required = this.reflector.getAllAndOverride<string[]>(ADMIN_ROLES_KEY, [
      ctx.getHandler(),
      ctx.getClass(),
    ]);
    if (!required || required.length === 0) return true;
    const req = ctx.switchToHttp().getRequest();
    const role: string | undefined = req?.user?.role ?? req?.user?.adminRole;
    if (!role) throw new ForbiddenException('admin role required');
    if (!required.includes(role)) {
      throw new ForbiddenException(`role ${role} not permitted (need: ${required.join(', ')})`);
    }
    return true;
  }
}

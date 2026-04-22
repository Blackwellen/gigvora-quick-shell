/**
 * @AdminRoles(...) decorator — attaches an `adminRoles` metadata array to the
 * route handler so RolesGuard can read it via Reflector.
 *
 * Used by FD-17 master-settings + super-admin command center to lock routes
 * to the four-tier admin ladder (viewer / sa_operator / sa_admin / sa_root).
 */
import { SetMetadata } from '@nestjs/common';

export const ADMIN_ROLES_KEY = 'adminRoles';
export const AdminRoles = (...roles: string[]) => SetMetadata(ADMIN_ROLES_KEY, roles);

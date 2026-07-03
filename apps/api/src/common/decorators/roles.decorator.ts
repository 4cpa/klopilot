import { SetMetadata } from '@nestjs/common';

export type Role = 'anon' | 'user' | 'verified' | 'moderator' | 'admin';

export const ROLES_KEY = 'roles';

/** An Controller/Handler: schränkt den Zugriff auf die angegebenen Rollen ein (mit RolesGuard kombinieren). */
export const Roles = (...roles: Role[]) => SetMetadata(ROLES_KEY, roles);

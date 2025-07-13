import { SetMetadata } from '@nestjs/common';
import { Role } from './roles.enum';

export const ROLES_KEY = 'roles';
/**
 * Utilise @Roles(Role.Admin, Role.Manager) pour restreindre l’accès
 */
export const Roles = (...roles: Role[]) => SetMetadata(ROLES_KEY, roles);

import { SetMetadata } from '@nestjs/common';
import { UserRole } from '../enums/user-role.enum';

export const ROLES_KEY = 'roles';

/**
 * @Roles(...) decorator sets metadata that defines which roles
 * are permitted to access a given route handler or controller class.
 */
export const Roles = (...roles: UserRole[]) => SetMetadata(ROLES_KEY, roles);

import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ROLES_KEY } from '../decorators/roles.decorator';
import { UserRole } from '../enums/user-role.enum';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    // Read the “roles” metadata set by @Roles() on handler or class
    const requiredRoles = this.reflector.getAllAndOverride<UserRole[]>(
      ROLES_KEY,
      [context.getHandler(), context.getClass()],
    );

    // If no roles are defined, allow access
    if (!requiredRoles || requiredRoles.length === 0) {
      return true;
    }

    // Extract the user object (attached by JwtAuthGuard) from the request
    const request = context.switchToHttp().getRequest();
    const user = request.user;

    if (!user || !user.role) {
      throw new ForbiddenException('User role not found');
    }

    // Deny if user.role is not in the array of requiredRoles
    if (!requiredRoles.includes(user.role as UserRole)) {
      throw new ForbiddenException('Insufficient permissions');
    }

    return true;
  }
}

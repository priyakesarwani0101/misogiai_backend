import { SetMetadata } from '@nestjs/common';

// This decorator no longer does anything since RolesGuard is a no-op:
export const Roles = () => SetMetadata('roles', []);

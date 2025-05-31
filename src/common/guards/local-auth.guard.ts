import { Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

/**
 * LocalAuthGuard uses the 'local' strategy (LocalStrategy) to validate
 * incoming login credentials (email & password). If successful, user is
 * attached to request.user; otherwise, an UnauthorizedException is thrown.
 */
@Injectable()
export class LocalAuthGuard extends AuthGuard('local') {}

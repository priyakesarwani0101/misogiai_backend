import {
  Injectable,
  ExecutionContext,
  UnauthorizedException,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

/**
 * JwtAuthGuard uses the 'jwt' strategy (JwtStrategy) to validate
 * JWTs sent in the Authorization: Bearer <token> header.
 */
@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  canActivate(context: ExecutionContext) {
    return super.canActivate(context);
  }

  handleRequest(err: any, user: any, info: any) {
    if (err || !user) {
      throw err || new UnauthorizedException('Unauthorized');
    }
    return user;
  }
}

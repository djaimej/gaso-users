import { ExecutionContext, Injectable, UnauthorizedException } from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import { AuthGuard } from "@nestjs/passport";
import { Observable } from "rxjs";
import { ConfigService } from "@nestjs/config";
import { ConfigurationEnum } from "@config/config.enum";
import { JwtService } from "@nestjs/jwt";
import { Request } from "express";
import { IAccessTokenPayload } from "@common/interfaces/access-token-payload.interface";
import { IS_PUBLIC_KEY } from "@decorators/public.decorator";

@Injectable()
export class JwtGuard extends AuthGuard('jwt') {
  constructor(
    private configService: ConfigService,
    private jwtService: JwtService,
    private reflector: Reflector
  ) {
    super();
  }

  canActivate(context: ExecutionContext): Promise<boolean> | boolean | Observable<boolean> {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    
    if (isPublic) { return true; }

    const request: Request = context.switchToHttp().getRequest();
    const token = this.extractTokenFromHeader(request);
    if (!token) { throw new UnauthorizedException(); }
    try {
      const payload: IAccessTokenPayload = this.jwtService.verify<IAccessTokenPayload>(
        token, { secret: this.configService.get<string>(ConfigurationEnum.JWT_SECRET) }
      );

      if (payload.exp && new Date(payload.exp) < new Date()) {
        throw new UnauthorizedException('Su sesión ha expirado');
      }

      request['user'] = payload;
    } catch {
      throw new UnauthorizedException();
    }

    return true;
  }


  private extractTokenFromHeader(request: Request): string | undefined {
    const [type, token] = request.headers.authorization?.split(' ') ?? [];
    return type === 'Bearer' ? token : undefined;
  }
}
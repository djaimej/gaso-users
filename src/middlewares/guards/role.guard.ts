import { Roles } from "@decorators/role.decorator";
import { Role } from "@common/enums/role.enum";
import { IAccessTokenPayload } from "@common/interfaces/access-token-payload.interface";
import { CanActivate, ExecutionContext, Injectable } from "@nestjs/common";
import { Reflector } from "@nestjs/core";

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const roles = this.reflector.get(Roles, context.getHandler());
    if (!roles) { return true; }
    const request = context.switchToHttp().getRequest();
    const user: IAccessTokenPayload = request.user;
    return matchRoles(roles, user.role);
  }
}

function matchRoles(roles: string[], role: Role): boolean {
  return roles.includes(role);
}


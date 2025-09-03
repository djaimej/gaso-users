import { Injectable, UnauthorizedException } from "@nestjs/common";
import { PassportStrategy } from "@nestjs/passport";
import { Strategy, ExtractJwt } from "passport-jwt";
import { ConfigService } from "@nestjs/config";
import { IAccessTokenPayload } from "@common/interfaces/access-token-payload.interface";
import { ConfigurationEnum } from "@config/config.enum";

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
    constructor(configService: ConfigService) {
        super({
            jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
            ignoreExpiration: false,
            secretOrKey: `${configService.get(ConfigurationEnum.JWT_SECRET)}`,
        });
    }

    public async validate(payload: IAccessTokenPayload): Promise<IAccessTokenPayload> {
        if (payload.exp && new Date(payload.exp) < new Date()) { throw new UnauthorizedException('Su sesión ha expirado'); } 
        return payload;
    }
}
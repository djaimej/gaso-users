import { Role } from "@common/enums/role.enum";

export interface IAccessTokenPayload {
    readonly id: string;
    readonly email: string;
    readonly name: string;
    readonly role: Role;
    readonly iat: number;
    readonly exp?: number;
}
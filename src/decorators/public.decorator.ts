import { SetMetadata } from "@nestjs/common";
import { Transform } from "class-transformer";

export const IS_PUBLIC_KEY = 'isPublic';
export const Public = () => SetMetadata(IS_PUBLIC_KEY, true);

export const optionalBooleanMapper = new Map([
    ['undefined', undefined],
    ['true', true],
    ['false', false],
]);
export const ParseOptionalBoolean = () => Transform(({ value }) => optionalBooleanMapper.get(value));
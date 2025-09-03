export interface IResponse<T> {
    readonly data: T;
    readonly message: string;
    readonly statusCode: number;
    readonly error?: string,
}
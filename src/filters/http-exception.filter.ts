
import { httpErrorCodes } from "@common/consts/error";
import { IResponse } from "@common/interfaces/response.interface";
import { ExceptionFilter, Catch, ArgumentsHost, HttpException } from "@nestjs/common";
import { Response } from "express";

@Catch(HttpException)
export class HttpExceptionFilter implements ExceptionFilter {
  catch(exception: HttpException, host: ArgumentsHost) {
    const exceptionResponse = (exception.getResponse() as IResponse<undefined>);
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const status = exception.getStatus();
    response.status(status).json({ ...exceptionResponse, error: httpErrorCodes.get(status) || exceptionResponse.error });
  }
}


import { ExceptionFilter, Catch, ArgumentsHost, HttpStatus } from "@nestjs/common";
import { Response } from "express";
import { QueryFailedError } from "typeorm";
import { DatabaseError } from "pg-protocol";
import { dbError, dbErrorCodes } from "@common/consts/error";

@Catch(QueryFailedError<DatabaseError>)
export class QueryErrorFilter implements ExceptionFilter {
  catch(queryError: QueryFailedError<DatabaseError>, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const message = queryError.driverError.code ? dbErrorCodes.get(queryError.driverError.code) : dbError;
    const error = queryError.name;
    response.status(HttpStatus.UNPROCESSABLE_ENTITY).json(
      { statusCode: HttpStatus.UNPROCESSABLE_ENTITY, message: message || queryError.message, error }
    );
  }
}

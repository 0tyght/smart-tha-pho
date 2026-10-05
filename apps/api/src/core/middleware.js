import { config } from "./config.js";
import { pool } from "./db.js";
import { AuthenticateRequestUseCase } from "../application/security/AuthenticateRequestUseCase.js";
import { JwtSessionTokenService } from "../infrastructure/security/JwtSessionTokenService.js";
import { MariaDbStaffAccountRepository } from "../infrastructure/security/MariaDbStaffAccountRepository.js";
import { AuthMiddleware } from "../presentation/http/AuthMiddleware.js";
import { ErrorHandlerMiddleware } from "../presentation/http/ErrorHandlerMiddleware.js";
import { RequestContextMiddleware } from "../presentation/http/RequestContextMiddleware.js";
import { RoleAuthorizationMiddleware } from "../presentation/http/RoleAuthorizationMiddleware.js";

const sessionTokenService = new JwtSessionTokenService({ jwtSecret: config.jwtSecret });
const staffAccountRepository = new MariaDbStaffAccountRepository({ database: pool });
const authenticateRequestUseCase = new AuthenticateRequestUseCase({
  sessionTokenService,
  staffAccountRepository,
});

export const authMiddleware = new AuthMiddleware({ authenticateRequestUseCase });
export const roleAuthorizationMiddleware = new RoleAuthorizationMiddleware();
export const requestContextMiddleware = new RequestContextMiddleware();
export const errorHandlerMiddleware = new ErrorHandlerMiddleware();

export async function authenticate(req, res, next) {
  return authMiddleware.authenticate(req, res, next);
}

export function requireRole(...roles) {
  return roleAuthorizationMiddleware.require(...roles);
}

export function requestContext(req, res, next) {
  return requestContextMiddleware.handle(req, res, next);
}

export function errorHandler(error, req, res, _next) {
  return errorHandlerMiddleware.handle(error, req, res, _next);
}

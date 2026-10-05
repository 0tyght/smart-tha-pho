import { AuthenticationError } from "../../application/security/AuthenticationError.js";

export class AuthMiddleware {
  constructor({ authenticateRequestUseCase }) {
    if (!authenticateRequestUseCase) {
      throw new TypeError("AuthMiddleware requires authenticateRequestUseCase");
    }

    this.authenticateRequestUseCase = authenticateRequestUseCase;
    this.authenticate = this.authenticate.bind(this);
  }

  async authenticate(req, res, next) {
    const token = req.headers.authorization?.replace(/^Bearer\s+/i, "");
    if (!token) return res.status(401).json({ message: "กรุณาเข้าสู่ระบบ" });

    try {
      req.user = await this.authenticateRequestUseCase.execute({ token });
      return next();
    } catch (error) {
      if (error instanceof AuthenticationError) {
        return res.status(401).json({ message: error.message });
      }

      return next(error);
    }
  }

  requireRole(...roles) {
    return (req, res, next) =>
      roles.includes(req.user?.role)
        ? next()
        : res.status(403).json({ message: "ไม่มีสิทธิ์ดำเนินการ" });
  }
}

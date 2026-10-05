import { AuthenticationError } from "./AuthenticationError.js";

export class AuthenticateRequestUseCase {
  constructor({ sessionTokenService, staffAccountRepository }) {
    if (!sessionTokenService || !staffAccountRepository) {
      throw new TypeError(
        "AuthenticateRequestUseCase requires sessionTokenService and staffAccountRepository",
      );
    }

    this.sessionTokenService = sessionTokenService;
    this.staffAccountRepository = staffAccountRepository;
  }

  async execute({ token }) {
    let payload;

    try {
      payload = this.sessionTokenService.verify(token);
    } catch (cause) {
      throw new AuthenticationError("เซสชันหมดอายุ กรุณาเข้าสู่ระบบใหม่", {
        code: "INVALID_SESSION",
        cause,
      });
    }

    if (!payload.staffSession) return payload;

    const account = await this.staffAccountRepository.findActiveById(payload.sub);
    if (!account) {
      throw new AuthenticationError("บัญชีถูกปิดใช้งาน กรุณาติดต่อผู้ดูแลระบบ", {
        code: "INACTIVE_STAFF_ACCOUNT",
      });
    }

    return {
      ...payload,
      sub: account.id,
      name: account.fullName,
      email: account.email,
      role: account.role,
      villageId: account.villageId,
    };
  }
}

export class AuthenticationError extends Error {
  constructor(message, { code = "AUTHENTICATION_FAILED", cause } = {}) {
    super(message, { cause });
    this.name = "AuthenticationError";
    this.code = code;
  }
}

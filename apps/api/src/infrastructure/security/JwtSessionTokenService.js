import jwt from "jsonwebtoken";

export class JwtSessionTokenService {
  constructor({ jwtSecret }) {
    if (!jwtSecret) throw new TypeError("JwtSessionTokenService requires jwtSecret");
    this.jwtSecret = jwtSecret;
  }

  verify(token) {
    return jwt.verify(token, this.jwtSecret);
  }
}

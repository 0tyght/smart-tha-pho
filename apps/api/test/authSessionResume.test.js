import assert from "node:assert/strict";
import test from "node:test";
import jwt from "jsonwebtoken";
import { JwtSessionTokenService } from "../src/infrastructure/security/JwtSessionTokenService.js";

const SECRET = "test-secret-for-session-resume";

function signExpiredToken({ staffSession, issuedHoursAgo = 1 }) {
  const issuedAt = Math.floor(
    (Date.now() - issuedHoursAgo * 60 * 60 * 1000) / 1000,
  );

  return jwt.sign(
    {
      sub: "staff-1",
      role: staffSession ? "OFFICER" : "CITIZEN",
      staffSession,
      iat: issuedAt,
    },
    SECRET,
    { expiresIn: "30m" },
  );
}

test("valid staff token is accepted", () => {
  const token = jwt.sign(
    { sub: "staff-1", role: "OFFICER", staffSession: true },
    SECRET,
    { expiresIn: "12h" },
  );
  const tokenService = new JwtSessionTokenService({ jwtSecret: SECRET });

  const payload = tokenService.verify(token);

  assert.equal(payload.sub, "staff-1");
  assert.equal(payload.staffSession, true);
});

test("expired staff token is rejected", () => {
  const token = signExpiredToken({ staffSession: true, issuedHoursAgo: 1 });
  const tokenService = new JwtSessionTokenService({ jwtSecret: SECRET });

  assert.throws(() => tokenService.verify(token));
});

test("expired non-staff token is rejected", () => {
  const token = signExpiredToken({ staffSession: false, issuedHoursAgo: 1 });
  const tokenService = new JwtSessionTokenService({ jwtSecret: SECRET });

  assert.throws(() => tokenService.verify(token));
});

test("staff token older than the maximum workday session is rejected", () => {
  const token = signExpiredToken({ staffSession: true, issuedHoursAgo: 13 });
  const tokenService = new JwtSessionTokenService({ jwtSecret: SECRET });

  assert.throws(() => tokenService.verify(token));
});

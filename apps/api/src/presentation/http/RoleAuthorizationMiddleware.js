export class RoleAuthorizationMiddleware {
  require(...roles) {
    const allowedRoles = new Set(roles);

    return (req, res, next) =>
      allowedRoles.has(req.user?.role)
        ? next()
        : res.status(403).json({ message: "ไม่มีสิทธิ์ดำเนินการ" });
  }
}

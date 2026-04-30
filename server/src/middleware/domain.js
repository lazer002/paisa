export const allowDomains = (...allowedTypes) => {
  return (req, res, next) => {
    // super_admin bypass
    if (req.user.role === "super_admin") return next();

    // 🔥 domain should already be attached in authMiddleware
    if (!req.user.domain) {
      return res.status(403).json({
        success: false,
        message: "User domain not found",
      });
    }

    if (!allowedTypes.includes(req.user.domain)) {
      return res.status(403).json({
        success: false,
        message: `Forbidden: ${req.user.domain} cannot access this resource`,
      });
    }

    next();
  };
};
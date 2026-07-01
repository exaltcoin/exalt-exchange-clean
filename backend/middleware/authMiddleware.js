const jwt = require("jsonwebtoken");
const User = require("../models/user");

if (!process.env.JWT_SECRET) {
  throw new Error("JWT_SECRET is missing in environment variables");
}

const protect = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({
        success: false,
        message: "Not authorized, token missing",
      });
    }

    const token = authHeader.split(" ")[1];

    if (!token) {
      return res.status(401).json({
        success: false,
        message: "Not authorized, token missing",
      });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    if (!decoded || !decoded.id) {
      return res.status(401).json({
        success: false,
        message: "Invalid token payload",
      });
    }

    const user = await User.findById(decoded.id).select(
      "-password -twoFactorSecret -twoFactorBackupCodes -emailVerificationToken -emailVerificationExpire -resetPasswordToken -resetPasswordExpire"
    );

    if (!user) {
      return res.status(401).json({
        success: false,
        message: "User not found",
      });
    }

    if (!user.isEmailVerified && user.role !== "admin") {
      return res.status(403).json({
        success: false,
        emailNotVerified: true,
        message: "Please verify your email before continuing",
      });
    }

    if (user.accountStatus === "Suspended" || user.accountStatus === "Frozen") {
      return res.status(403).json({
        success: false,
        message: `Account is ${user.accountStatus}`,
      });
    }

    req.user = user;
    next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      message: "Invalid or expired token",
    });
  }
};

const adminOnly = (req, res, next) => {
  if (req.user && req.user.role === "admin") {
    return next();
  }

  return res.status(403).json({
    success: false,
    message: "Admin access only",
  });
};

module.exports = { protect, adminOnly };
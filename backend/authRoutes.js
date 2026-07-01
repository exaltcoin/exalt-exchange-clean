const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("./models/user");
const crypto = require("crypto");
const { Resend } = require("resend");
const { protect, adminOnly } = require("./middleware/authMiddleware");
const speakeasy = require("speakeasy");
const qrcode = require("qrcode");
const multer = require("multer");

const resend = new Resend(process.env.RESEND_API_KEY);
const router = express.Router();

const storage = multer.memoryStorage();

const upload = multer({
  storage,
  limits: {
    fileSize: 5 * 1024 * 1024,
  },
});

const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: "7d",
  });
};

const createEmailVerificationToken = () => {
  const token = crypto.randomBytes(32).toString("hex");

  const hashedToken = crypto
    .createHash("sha256")
    .update(token)
    .digest("hex");

  return { token, hashedToken };
};

const generateBackupCodes = () => {
  const plainCodes = Array.from({ length: 8 }).map(() =>
    crypto.randomBytes(4).toString("hex").toUpperCase()
  );

  const hashedCodes = plainCodes.map((code) =>
    crypto.createHash("sha256").update(code).digest("hex")
  );

  return { plainCodes, hashedCodes };
};

const hashBackupCode = (code) => {
  return crypto
    .createHash("sha256")
    .update(String(code).trim().toUpperCase())
    .digest("hex");
};
const REFERRAL_REWARD_EXALT = Number(process.env.REFERRAL_REWARD_EXALT || 100);

const cleanReferralCode = (code) => {
  return String(code || "")
    .trim()
    .toUpperCase()
    .replace(/\s+/g, "");
};
const sendVerificationEmail = async (user, token) => {
  const frontendUrl = process.env.FRONTEND_URL || "http://localhost:5173";
  const verifyUrl = `${frontendUrl}/verify-email/${token}`;

  await resend.emails.send({
    from: `Exalt Exchange <${process.env.EMAIL_FROM}>`,
    to: user.email,
    subject: "Verify your Exalt Exchange email",
    html: `
      <h2>Verify Your Email</h2>
      <p>Welcome to Exalt Exchange.</p>
      <p>Click below to verify your email:</p>
      <a href="${verifyUrl}">${verifyUrl}</a>
      <p>This link will expire in 24 hours.</p>
    `,
  });
};

/* REGISTER */
router.post("/register", async (req, res) => {
  try {
    const { name, email, password, referralCode, referredByCode } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({
        success: false,
        message: "All fields are required",
      });
    }

    const normalizedEmail = email.toLowerCase().trim();
    const usedReferralCode = cleanReferralCode(referralCode || referredByCode);

    const userExists = await User.findOne({ email: normalizedEmail });

    if (userExists) {
      return res.status(400).json({
        success: false,
        message: "User already exists",
      });
    }

    let referrer = null;
if (usedReferralCode) {
  referrer = await User.findOne({ referralCode: usedReferralCode });

  if (!referrer) {
    return res.status(400).json({
      success: false,
      message: "Invalid referral code",
    });
  }

  if (referrer.email === normalizedEmail) {
    return res.status(400).json({
      success: false,
      message: "You cannot use your own referral code",
    });
  }
}
   

    const hashedPassword = await bcrypt.hash(password, 10);
    const { token, hashedToken } = createEmailVerificationToken();

    const isAdmin = normalizedEmail === "exaltconsultant786@gmail.com";

    const user = await User.create({
      name,
      email: normalizedEmail,
      password: hashedPassword,
      role: isAdmin ? "admin" : "user",
      isEmailVerified: isAdmin,
      emailVerifiedAt: isAdmin ? new Date() : null,
      emailVerificationToken: isAdmin ? "" : hashedToken,
      emailVerificationExpire: isAdmin ? null : Date.now() + 24 * 60 * 60 * 1000,
      accountStatus: isAdmin ? "Active" : "Pending Verification",

      referredBy: referrer ? referrer._id : null,
      referredByCode: referrer ? referrer.referralCode : "",

      lastVerificationEmailSentAt: isAdmin ? null : new Date(),
    });

   if (referrer && String(referrer._id) !== String(user._id)) {
  const alreadyRewarded = referrer.referralRewards.some(
    (reward) =>
      String(reward.referredEmail || "").toLowerCase() === user.email.toLowerCase()
  );

  if (!alreadyRewarded) {
    referrer.referralCount = Number(referrer.referralCount || 0) + 1;
    referrer.pendingReferralRewards =
      Number(referrer.pendingReferralRewards || 0) + REFERRAL_REWARD_EXALT;

    referrer.referralRewards.push({
      referredUser: user._id,
      referredEmail: user.email,
      rewardAmount: REFERRAL_REWARD_EXALT,
      coin: "EXALT",
      status: "pending",
      note: "Reward pending until admin approval",
    });

    await referrer.save();
  }
}

    if (!isAdmin) {
      await sendVerificationEmail(user, token);
    }

    res.status(201).json({
      success: true,
      message: isAdmin
        ? "Admin registered successfully"
        : "Registration successful. Please verify your email.",
      token: isAdmin ? generateToken(user._id) : null,
      emailVerificationRequired: !isAdmin,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        isEmailVerified: user.isEmailVerified,
        referralCode: user.referralCode,
        referredByCode: user.referredByCode,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Register failed",
      error: error.message,
    });
  }
});
/* VERIFY EMAIL */
router.get("/verify-email/:token", async (req, res) => {
  try {
    const hashedToken = crypto
      .createHash("sha256")
      .update(req.params.token)
      .digest("hex");

    const user = await User.findOne({
      emailVerificationToken: hashedToken,
      emailVerificationExpire: { $gt: Date.now() },
    }).select("+emailVerificationToken +emailVerificationExpire");

    if (!user) {
      return res.status(400).json({
        success: false,
        message: "Invalid or expired verification link",
      });
    }

    user.isEmailVerified = true;
    user.emailVerifiedAt = new Date();
    user.emailVerificationToken = "";
    user.emailVerificationExpire = null;
    user.accountStatus = "Active";

    await user.save();

    res.json({
      success: true,
      message: "Email verified successfully",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Email verification failed",
      error: error.message,
    });
  }
});

/* RESEND VERIFICATION */
router.post("/resend-verification", async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        success: false,
        message: "Email is required",
      });
    }

    const user = await User.findOne({
      email: email.toLowerCase().trim(),
    }).select("+emailVerificationToken +emailVerificationExpire");

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    if (user.isEmailVerified) {
      return res.json({
        success: true,
        message: "Email already verified",
      });
    }

    const { token, hashedToken } = createEmailVerificationToken();

    user.emailVerificationToken = hashedToken;
    user.emailVerificationExpire = Date.now() + 24 * 60 * 60 * 1000;
    user.lastVerificationEmailSentAt = new Date();

    await user.save();

    await sendVerificationEmail(user, token);

    res.json({
      success: true,
      message: "Verification email sent",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to resend verification email",
      error: error.message,
    });
  }
});

/* LOGIN */
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({
      email: email.toLowerCase().trim(),
    }).select("+password +twoFactorSecret");

    if (!user) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password",
      });
    }

    let isMatch = false;

    if (user.password && user.password.startsWith("$2")) {
      isMatch = await bcrypt.compare(password, user.password);
    } else {
      isMatch = password === user.password;

      if (isMatch) {
        user.password = await bcrypt.hash(password, 10);
        await user.save();
      }
    }

    if (!isMatch) {
      user.failedLoginAttempts = Number(user.failedLoginAttempts || 0) + 1;
      await user.save();

      return res.status(401).json({
        success: false,
        message: "Invalid email or password",
      });
    }

    if (!user.isEmailVerified && user.role !== "admin") {
      return res.status(403).json({
        success: false,
        emailNotVerified: true,
        message: "Please verify your email before login",
      });
    }

    if (user.accountStatus === "Suspended" || user.accountStatus === "Frozen") {
      return res.status(403).json({
        success: false,
        message: `Account is ${user.accountStatus}`,
      });
    }

    user.failedLoginAttempts = 0;
    user.lastLoginAt = new Date();
    user.lastLoginIp = req.ip || "";
    await user.save();

    if (user.twoFactorEnabled) {
      return res.json({
        success: true,
        require2FA: true,
        userId: user._id,
        message: "2FA verification required",
      });
    }

    res.json({
      success: true,
      token: generateToken(user._id),
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        balance: user.balance,
        isEmailVerified: user.isEmailVerified,
        twoFactorEnabled: user.twoFactorEnabled,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Login failed",
      error: error.message,
    });
  }
});

/* 2FA LOGIN VERIFY */
router.post("/2fa/login-verify", async (req, res) => {
  try {
    const { userId, token, backupCode } = req.body;

    const user = await User.findById(userId).select(
      "+twoFactorSecret +twoFactorBackupCodes"
    );

    if (!user || !user.twoFactorSecret) {
      return res.status(400).json({
        success: false,
        message: "2FA not enabled",
      });
    }

    let verified = false;

    if (token) {
      verified = speakeasy.totp.verify({
        secret: user.twoFactorSecret,
        encoding: "base32",
        token,
        window: 1,
      });
    }

    if (!verified && backupCode) {
      const hashedBackupCode = hashBackupCode(backupCode);

      if (user.twoFactorBackupCodes.includes(hashedBackupCode)) {
        verified = true;

        user.twoFactorBackupCodes = user.twoFactorBackupCodes.filter(
          (code) => code !== hashedBackupCode
        );
      }
    }

    if (!verified) {
      user.failedLoginAttempts = Number(user.failedLoginAttempts || 0) + 1;
      await user.save();

      return res.status(400).json({
        success: false,
        message: "Invalid 2FA or backup code",
      });
    }

    user.failedLoginAttempts = 0;
    user.lastLoginAt = new Date();
    user.lastLoginIp = req.ip || "";

    await user.save();

    res.json({
      success: true,
      token: generateToken(user._id),
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        balance: user.balance,
        isEmailVerified: user.isEmailVerified,
        twoFactorEnabled: user.twoFactorEnabled,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
});

/* ME */
router.get("/me", protect, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select(
      "-password -twoFactorSecret -twoFactorBackupCodes -emailVerificationToken -emailVerificationExpire -resetPasswordToken -resetPasswordExpire"
    );

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    res.json({
      success: true,
      user,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
});

/* PROFILE */
router.put("/profile", protect, upload.single("profileImage"), async (req, res) => {
  try {
    const { name, phone, country, telegram, bio } = req.body;

    let profileImage = "";

    if (req.file) {
      profileImage = `data:${req.file.mimetype};base64,${req.file.buffer.toString("base64")}`;
    }

    const updateData = {
      name,
      phone,
      country,
      telegram,
      bio,
    };

    if (profileImage) {
      updateData.profileImage = profileImage;
    }

    const user = await User.findByIdAndUpdate(req.user.id, updateData, {
      new: true,
    }).select(
      "-password -twoFactorSecret -twoFactorBackupCodes -emailVerificationToken -emailVerificationExpire -resetPasswordToken -resetPasswordExpire"
    );

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    res.json({
      success: true,
      message: "Profile updated successfully",
      user,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Profile update failed",
      error: error.message,
    });
  }
});

/* ADMIN CHECK */
router.get("/admin/check", protect, adminOnly, async (req, res) => {
  res.json({
    success: true,
    message: "Admin verified",
    user: req.user,
  });
});

/* FORGOT PASSWORD */
router.post("/forgot-password", async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        success: false,
        message: "Email is required",
      });
    }

    const user = await User.findOne({
      email: email.toLowerCase().trim(),
    }).select("+resetPasswordToken +resetPasswordExpire");

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    const resetToken = crypto.randomBytes(32).toString("hex");

    user.resetPasswordToken = resetToken;
    user.resetPasswordExpire = Date.now() + 15 * 60 * 1000;

    await user.save();

    const frontendUrl = process.env.FRONTEND_URL || "http://localhost:5173";
    const resetUrl = `${frontendUrl}/reset-password/${resetToken}`;

    await resend.emails.send({
      from: `Exalt Exchange <${process.env.EMAIL_FROM}>`,
      to: email,
      subject: "Exalt Exchange Password Reset",
      html: `
        <h2>Exalt Exchange Password Reset</h2>
        <p>Click the link below to reset your password:</p>
        <a href="${resetUrl}">${resetUrl}</a>
        <p>This link will expire in 15 minutes.</p>
      `,
    });

    return res.json({
      success: true,
      message: "Password reset email sent",
    });
  } catch (error) {
    console.log("Forgot password error:", error);

    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
});

/* RESET PASSWORD */
router.post("/reset-password/:token", async (req, res) => {
  try {
    const user = await User.findOne({
      resetPasswordToken: req.params.token,
      resetPasswordExpire: { $gt: Date.now() },
    }).select("+password +resetPasswordToken +resetPasswordExpire");

    if (!user) {
      return res.status(400).json({
        success: false,
        message: "Invalid or expired token",
      });
    }

    const hashedPassword = await bcrypt.hash(req.body.password, 10);

    user.password = hashedPassword;
    user.passwordChangedAt = new Date();
    user.resetPasswordToken = undefined;
    user.resetPasswordExpire = undefined;

    await user.save();

    res.json({
      success: true,
      message: "Password reset successful",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
});

/* 2FA SETUP */
router.post("/2fa/setup", protect, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select("+twoFactorSecret");

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    const secret = speakeasy.generateSecret({
      name: `Exalt Exchange (${user.email})`,
      issuer: "Exalt Exchange",
    });

    user.twoFactorSecret = secret.base32;
    await user.save();

    const qrCode = await qrcode.toDataURL(secret.otpauth_url);

    res.json({
      success: true,
      qrCode,
      secret: secret.base32,
      message: "2FA setup generated",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
});

/* 2FA VERIFY */
router.post("/2fa/verify", protect, async (req, res) => {
  try {
    const { token } = req.body;

    const user = await User.findById(req.user.id).select(
      "+twoFactorSecret +twoFactorBackupCodes"
    );

    if (!user || !user.twoFactorSecret) {
      return res.status(400).json({
        success: false,
        message: "2FA is not set up",
      });
    }

    const verified = speakeasy.totp.verify({
      secret: user.twoFactorSecret,
      encoding: "base32",
      token,
      window: 1,
    });

    if (!verified) {
      return res.status(400).json({
        success: false,
        message: "Invalid 2FA code",
      });
    }

    const { plainCodes, hashedCodes } = generateBackupCodes();

    user.twoFactorEnabled = true;
    user.twoFactorBackupCodes = hashedCodes;

    await user.save();

    res.json({
      success: true,
      message: "2FA enabled successfully. Save your backup codes safely.",
      backupCodes: plainCodes,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
});

/* 2FA REGENERATE BACKUP CODES */
router.post("/2fa/regenerate-backup-codes", protect, async (req, res) => {
  try {
    const { token } = req.body;

    const user = await User.findById(req.user.id).select(
      "+twoFactorSecret +twoFactorBackupCodes"
    );

    if (!user || !user.twoFactorEnabled || !user.twoFactorSecret) {
      return res.status(400).json({
        success: false,
        message: "2FA is not enabled",
      });
    }

    const verified = speakeasy.totp.verify({
      secret: user.twoFactorSecret,
      encoding: "base32",
      token,
      window: 1,
    });

    if (!verified) {
      return res.status(400).json({
        success: false,
        message: "Invalid 2FA code",
      });
    }

    const { plainCodes, hashedCodes } = generateBackupCodes();

    user.twoFactorBackupCodes = hashedCodes;
    await user.save();

    res.json({
      success: true,
      message: "New backup codes generated. Save them safely.",
      backupCodes: plainCodes,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
});

/* 2FA DISABLE */
router.post("/2fa/disable", protect, async (req, res) => {
  try {
    const { token } = req.body;

    const user = await User.findById(req.user.id).select("+twoFactorSecret");

    if (!user || !user.twoFactorSecret) {
      return res.status(400).json({
        success: false,
        message: "2FA is not enabled",
      });
    }

    const verified = speakeasy.totp.verify({
      secret: user.twoFactorSecret,
      encoding: "base32",
      token,
      window: 1,
    });

    if (!verified) {
      return res.status(400).json({
        success: false,
        message: "Invalid 2FA code",
      });
    }

    user.twoFactorEnabled = false;
    user.twoFactorSecret = "";
    user.twoFactorBackupCodes = [];

    await user.save();

    res.json({
      success: true,
      message: "2FA disabled successfully",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
});

module.exports = router;
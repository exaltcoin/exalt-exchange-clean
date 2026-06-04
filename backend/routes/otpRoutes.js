const express = require("express");
const crypto = require("crypto");
const { Resend } = require("resend");
const resend = new Resend(process.env.RESEND_API_KEY);

const router = express.Router();

const otpStore = new Map();

function createOtp() {
  return String(Math.floor(100000 + Math.random() * 900000));
}

function hashOtp(otp) {
  return crypto.createHash("sha256").update(otp).digest("hex");
}

function saveOtp(key, otp) {
  otpStore.set(key, {
    otpHash: hashOtp(otp),
    expiresAt: Date.now() + 5 * 60 * 1000,
    attempts: 0,
  });
}

function verifyOtp(key, otp) {
  const record = otpStore.get(key);
  if (!record) return false;
  if (Date.now() > record.expiresAt) {
    otpStore.delete(key);
    return false;
  }

  record.attempts += 1;
  if (record.attempts > 5) {
    otpStore.delete(key);
    return false;
  }

  const ok = record.otpHash === hashOtp(otp);
  if (ok) otpStore.delete(key);
  return ok;
}

const mailer = new Resend(process.env.RESEND_API_KEY);


router.post("/send-email", async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ success: false, message: "Email required" });

    const otp = createOtp();
    saveOtp(`email:${email}`, otp);

    await mailer.emails.send({
  from: process.env.EMAIL_FROM,
  to: email,
  subject: "Exalt Exchange Email Verification Code",
  html: `
    <h2>Exalt Exchange Verification</h2>
    <p>Your verification code is:</p>
    <h1>${otp}</h1>
    <p>This code expires in 5 minutes.</p>
  `,
});

    res.json({ success: true, message: "Email OTP sent" });
  } catch (error) {
    console.error("Email OTP error:", error);
    res.status(500).json({ success: false, message: "Failed to send email OTP" });
  }
});

router.post("/verify-email", async (req, res) => {
  try {
    const { email, otp } = req.body;
    if (!email || !otp) return res.status(400).json({ success: false, message: "Email and OTP required" });

    const ok = verifyOtp(`email:${email}`, otp);
    res.json({ success: ok, verified: ok, message: ok ? "Email verified" : "Invalid or expired OTP" });
  } catch (error) {
    res.status(500).json({ success: false, message: "Email verification failed" });
  }
});

router.post("/send-phone", async (req, res) => {
  try {
    const { phone } = req.body;
    if (!phone) return res.status(400).json({ success: false, message: "Phone required" });

    const otp = createOtp();
    saveOtp(`phone:${phone}`, otp);

    console.log(`PHONE OTP for ${phone}: ${otp}`);

    res.json({
      success: true,
      message: "Phone OTP generated. Connect Twilio later for real SMS.",
    });
  } catch (error) {
    res.status(500).json({ success: false, message: "Failed to send phone OTP" });
  }
});

router.post("/verify-phone", async (req, res) => {
  try {
    const { phone, otp } = req.body;
    if (!phone || !otp) return res.status(400).json({ success: false, message: "Phone and OTP required" });

    const ok = verifyOtp(`phone:${phone}`, otp);
    res.json({ success: ok, verified: ok, message: ok ? "Phone verified" : "Invalid or expired OTP" });
  } catch (error) {
    res.status(500).json({ success: false, message: "Phone verification failed" });
  }
});

module.exports = router;
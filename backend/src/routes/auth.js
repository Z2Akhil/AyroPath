import express from "express";
import AuthController from "../controllers/authController.js";
import { otpRateLimit, apiRateLimit } from "../middleware/rateLimit.js";
import auth from "../middleware/auth.js";

const router = express.Router();

router.use(apiRateLimit);

// Phone-based authentication (existing)
router.post("/request-otp", otpRateLimit, AuthController.requestOTP);
router.post("/verify-otp", AuthController.verifyOTP);
router.post("/register", AuthController.register);
router.post("/set-password", AuthController.setPassword);
router.post("/login", AuthController.login);
router.post("/forgot-password", otpRateLimit, AuthController.forgotPassword);
router.post("/reset-password", AuthController.resetPassword);

// Email-based authentication (new)
router.post("/email-register", AuthController.emailRegister);
router.post("/email-login", AuthController.emailLogin);
router.post("/forgot-password-email", AuthController.forgotPasswordEmail);
router.post("/reset-password-email", AuthController.resetPasswordEmail);
router.get("/verify-email/:token", AuthController.verifyEmail);
router.post("/resend-verification", auth, AuthController.resendVerification);
router.post("/resend-verification-public", AuthController.resendVerificationPublic);

// Email OTP verification
router.post("/request-email-otp", otpRateLimit, AuthController.requestEmailOTP);
router.post("/verify-email-otp", AuthController.verifyEmailOTP);
router.post("/email-register-with-otp", AuthController.emailRegisterWithOTP);

// Profile
router.get("/profile", auth, AuthController.getProfile);

export default router;

import User from "../models/User.js";
import OTP from "../models/OTP.js";
import jwt from "jsonwebtoken";
import validator from "validator";
import OTPGenerator from "../utils/otpGenerator.js";
import SMSService from "../utils/smsService.js";
import EmailService from "../utils/emailService.js";
import crypto from 'crypto';

class AuthController {
  static async requestOTP(req, res) {
    try {
      const { mobileNumber, purpose = "verification" } = req.body;
      if (!mobileNumber) {
        return res.status(400).json({
          success: false,
          message: "Mobile number is required",
        });
      }

      if (purpose == "verification") {
        const existingUser = await User.findOne({ mobileNumber });
        if (existingUser && existingUser.isVerified) {
          return res.status(400).json({
            success: false,
            message: "Mobile number is already verified",
          });
        }
      }

      const otp = OTPGenerator.generateOTP();
      const expiresAt = OTPGenerator.getExpiryTime();

      // Send OTP via Message Central
      const smsResult = await SMSService.sendOTP(mobileNumber, otp, { purpose });

      if (!smsResult.success) {
        return res.status(500).json({
          success: false,
          message: smsResult.message || "Failed to send OTP",
        });
      }

      // Create OTP record with verificationId if available
      const otpData = {
        mobileNumber,
        otp,
        purpose,
        expiresAt,
        provider: smsResult.provider || "MessageCentral",
        metadata: {
          transactionId: smsResult.transactionId,
          timeout: smsResult.timeout,
        }
      };

      // Store verificationId if provided by Message Central
      if (smsResult.verificationId) {
        otpData.verificationId = smsResult.verificationId;
      }

      await OTP.create(otpData);

      return res.json({
        success: true,
        message: "OTP sent successfully",
        purpose,
        provider: smsResult.provider,
        verificationId: smsResult.verificationId, // Include for client if needed
      });
    } catch (err) {
      console.error("OTP request error: ", err);
      res.status(500).json({
        success: false,
        message: "Internal server error",
      });
    }
  }

  static async verifyOTP(req, res) {
    try {
      const { mobileNumber, otp, purpose = "verification", verificationId } = req.body;

      if (!mobileNumber || !otp) {
        return res.status(400).json({
          success: false,
          message: "Mobile number and OTP are required",
        });
      }

      // Find the OTP record
      const otpRecord = await OTP.findOne({
        mobileNumber,
        purpose,
        isUsed: false,
        expiresAt: { $gt: new Date() },
      }).sort({ createdAt: -1 });

      if (!otpRecord) {
        return res.status(400).json({
          success: false,
          message: "Invalid or expired OTP",
        });
      }

      if (otpRecord.attempts >= 3) {
        return res.status(400).json({
          success: false,
          message: "Too many failed attempts. Please request new OTP",
        });
      }

      // Check if we have a verificationId (Message Central flow)
      const actualVerificationId = verificationId || otpRecord.verificationId;

      if (!actualVerificationId) {
        return res.status(400).json({
          success: false,
          message: "Verification ID is required for OTP validation",
        });
      }

      // Use Message Central validation
      const validationResult = await SMSService.validateOTP(actualVerificationId, otp);

      if (!validationResult.success) {
        otpRecord.attempts += 1;
        await otpRecord.save();

        return res.status(400).json({
          success: false,
          message: validationResult.message,
          errorCode: validationResult.errorCode,
        });
      }

      // OTP validated successfully via Message Central
      otpRecord.isUsed = true;
      await otpRecord.save();

      let user;

      if (purpose === "verification") {
        user = await User.findOneAndUpdate(
          { mobileNumber },
          { isVerified: true },
          { new: true, upsert: true }
        );
      }

      res.json({
        success: true,
        message: "OTP verified successfully",
        user:
          purpose === "verification"
            ? {
              id: user._id,
              mobileNumber: user.mobileNumber,
              isVerified: user.isVerified,
            }
            : undefined,
        purpose,
        provider: otpRecord.provider,
      });
    } catch (err) {
      console.error("OTP verification error: ", err);
      return res.status(500).json({
        success: false,
        message: "Internal server error",
      });
    }
  }

  static async setPassword(req, res) {
    try {
      const { mobileNumber, password } = req.body;

      if (!mobileNumber || !password) {
        return res.status(400).json({
          success: false,
          message: "Mobile number and password is required",
        });
      }

      if (password.length < 6) {
        return res.status(400).json({
          success: false,
          message: "Password must be atleast 6 characters long.",
        });
      }

      const user = await User.findOne({ mobileNumber, isVerified: true });

      if (!user) {
        return res.status(404).json({
          success: false,
          message: "User not found or not verified",
        });
      }

      user.password = password;
      await user.save();

      const token = jwt.sign(
        {
          id: user._id,
        },
        process.env.JWT_SECRET,
        { expiresIn: process.env.JWT_EXPIRES_IN }
      );

      res.json({
        success: true,
        message: "Password set successfully",
        token,
        user: {
          id: user._id,
          mobileNumber: mobileNumber,
          isVerified: user.isVerified,
        },
      });
    } catch (err) {
      console.error("Set password error: ", err);
      res.status(500).json({
        successs: false,
        message: "Internal server error",
      });
    }
  }

  static async login(req, res) {
    try {
      const { identifier, password } = req.body;

      if (!identifier || !password) {
        return res.status(400).json({
          success: false,
          message: "Mobile number/email and password are required",
        });
      }

      // Determine if identifier is mobile number or email
      const isMobileNumber = validator.isMobilePhone(identifier, "any", { strictMode: false });
      const isEmail = validator.isEmail(identifier);

      if (!isMobileNumber && !isEmail) {
        return res.status(400).json({
          success: false,
          message: "Please enter a valid mobile number or email address",
        });
      }

      // Build query based on identifier type
      let query;
      if (isMobileNumber) {
        query = { mobileNumber: identifier };
      } else {
        query = { email: identifier.toLowerCase() };
      }

      // Add verification and active status checks
      query.isVerified = true;

      const user = await User.findOne(query).select("+password");

      if (!user || !user.isActive) {
        return res.status(401).json({
          success: false,
          message: "Invalid credentials",
        });
      }

      // Check if user has a password set (might be Google auth or incomplete profile)
      if (!user.password) {
        return res.status(400).json({
          success: false,
          message: "Please login with your social account or complete registration",
        });
      }

      const isPasswordValid = await user.comparePassword(password);

      if (!isPasswordValid) {
        return res.status(401).json({
          success: false,
          message: "Invalid credentials",
        });
      }

      const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
        expiresIn: process.env.JWT_EXPIRES_IN,
      });

      res.json({
        success: true,
        message: "Login successful",
        token,
        user: {
          id: user._id,
          firstName: user.firstName,
          lastName: user.lastName,
          mobileNumber: user.mobileNumber,
          email: user.email,
          isVerified: user.isVerified,
          emailVerified: user.emailVerified,
        },
      });
    } catch (err) {
      console.error("Login error: ", err);
      res.status(500).json({
        success: false,
        message: "Internal server error",
      });
    }
  }

  // Forgot password - request OTP
  static async forgotPassword(req, res) {
    try {
      const { mobileNumber } = req.body;

      if (!mobileNumber) {
        return res.status(400).json({
          success: false,
          message: "Mobile number is required",
        });
      }

      const user = await User.findOne({ mobileNumber, isVerified: true });

      if (!user) {
        return res.status(404).json({
          success: false,
          message: "User not found",
        });
      }

      // Generate OTP for password reset
      const otp = OTPGenerator.generateOTP();
      const expiresAt = OTPGenerator.getExpiryTime();

      // Send OTP via Message Central
      const smsResult = await SMSService.sendOTP(mobileNumber, otp, { purpose: "forgot_password" });

      if (!smsResult.success) {
        return res.status(500).json({
          success: false,
          message: smsResult.message || "Failed to send OTP",
        });
      }

      // Create OTP record with verificationId if available
      const otpData = {
        mobileNumber,
        otp,
        purpose: "forgot_password",
        expiresAt,
        provider: smsResult.provider || "MessageCentral",
        metadata: {
          transactionId: smsResult.transactionId,
          timeout: smsResult.timeout,
        }
      };

      // Store verificationId if provided by Message Central
      if (smsResult.verificationId) {
        otpData.verificationId = smsResult.verificationId;
      }

      await OTP.create(otpData);

      res.json({
        success: true,
        message: "OTP sent for password reset",
        provider: smsResult.provider,
        verificationId: smsResult.verificationId,
      });
    } catch (error) {
      console.error("Forgot password error:", error);
      res.status(500).json({
        success: false,
        message: "Internal server error",
      });
    }
  }

  // Reset password with OTP
  static async resetPassword(req, res) {
    try {
      const { mobileNumber, otp, newPassword, verificationId } = req.body;

      if (!mobileNumber || !otp || !newPassword) {
        return res.status(400).json({
          success: false,
          message: "Mobile number, OTP and new password are required",
        });
      }

      if (newPassword.length < 6) {
        return res.status(400).json({
          success: false,
          message: "Password must be at least 6 characters long",
        });
      }

      // Find the OTP record
      const otpRecord = await OTP.findOne({
        mobileNumber,
        purpose: "forgot_password",
        isUsed: false,
        expiresAt: { $gt: new Date() },
      }).sort({ createdAt: -1 });

      if (!otpRecord) {
        return res.status(400).json({
          success: false,
          message: "Invalid or expired OTP",
        });
      }

      if (otpRecord.attempts >= 3) {
        return res.status(400).json({
          success: false,
          message: "Too many failed attempts. Please request new OTP",
        });
      }

      // Check if we have a verificationId (Message Central flow)
      const actualVerificationId = verificationId || otpRecord.verificationId;

      // Use Message Central validation
      const validationResult = await SMSService.validateOTP(actualVerificationId, otp);

      if (!validationResult.success) {
        otpRecord.attempts += 1;
        await otpRecord.save();

        return res.status(400).json({
          success: false,
          message: validationResult.message,
          errorCode: validationResult.errorCode,
        });
      }

      // OTP validated successfully via Message Central
      otpRecord.isUsed = true;
      await otpRecord.save();

      const user = await User.findOne({ mobileNumber, isVerified: true });

      if (!user) {
        return res.status(404).json({
          success: false,
          message: "User not found",
        });
      }

      // Update password
      user.password = newPassword;
      await user.save();

      res.json({
        success: true,
        message: "Password reset successfully",
        provider: otpRecord.provider,
      });
    } catch (error) {
      console.error("Reset password error:", error);
      res.status(500).json({
        success: false,
        message: "Internal server error",
      });
    }
  }

  static async register(req, res) {
    try {
      // Stage 3: Complete Profile (OTP already verified in Stage 2)
      const { firstName, lastName, mobileNumber, password, email } = req.body;

      if (!firstName || !lastName || !mobileNumber || !password) {
        return res.status(400).json({
          success: false,
          message: "All fields are required (firstName, lastName, mobileNumber, password)",
        });
      }

      if (password.length < 6) {
        return res.status(400).json({
          success: false,
          message: "Password must be at least 6 characters long",
        });
      }

      // Check for existing user (Status must be: Verified Mobile but Incomplete Profile)
      const user = await User.findOne({ mobileNumber });

      if (!user) {
        // Security: Can't register without passing Stage 2 (which creates the user stub)
        return res.status(400).json({
          success: false,
          message: "Mobile number not verified. Please verify OTP first.",
        });
      }

      if (user.isVerified && user.password) {
        return res.status(400).json({
          success: false,
          message: "User with this mobile number already exists.",
        });
      }

      // Update the verified stub user with profile details
      user.firstName = firstName;
      user.lastName = lastName;
      user.password = password; // Will be hashed by pre-save hook
      user.updatedAt = Date.now();

      // If email is provided, save it and generate verification token
      if (email) {
        // Check if email unique
        const emailExists = await User.findOne({ email });
        if (emailExists && emailExists._id.toString() !== user._id.toString()) {
          return res.status(400).json({
            success: false,
            message: "Email is already in use by another account",
          });
        }
        user.email = email;

        // Generate verification token
        const verificationToken = crypto.randomBytes(32).toString('hex');
        user.emailVerificationToken = crypto.createHash('sha256').update(verificationToken).digest('hex');
        user.emailVerificationExpires = Date.now() + 24 * 60 * 60 * 1000; // 24 hours

        await user.save();

        // Send welcome email with verification link
        const verifyURL = `${req.protocol}://${req.get('host')}/api/v1/auth/verify-email/${verificationToken}`;
        // Or simpler for frontend handling: `${process.env.CLIENT_URL}/verify-email?token=${verificationToken}`
        // Let's use CLIENT_URL based link
        const clientVerifyURL = `${process.env.CLIENT_URL || 'http://localhost:5173'}/verify-email?token=${verificationToken}`;

        EmailService.sendWelcomeEmail(email, firstName, clientVerifyURL).catch(err => {
          console.error("Failed to send welcome email:", err);
        });
      } else {
        await user.save();
      }

      const token = jwt.sign(
        {
          id: user._id,
        },
        process.env.JWT_SECRET,
        { expiresIn: process.env.JWT_EXPIRES_IN }
      );

      res.json({
        success: true,
        message: "Registration completed successfully",
        token,
        user: {
          id: user._id,
          firstName: user.firstName,
          lastName: user.lastName,
          mobileNumber: user.mobileNumber,
          isVerified: user.isVerified,
          email: user.email,
          emailVerified: user.emailVerified
        },
      });
    } catch (err) {
      console.error("Registration error: ", err);
      res.status(500).json({
        success: false,
        message: "Internal server error",
      });
    }
  }

  // Email/Password Registration
  static async emailRegister(req, res) {
    try {
      const { firstName, lastName, email, password } = req.body;

      if (!firstName || !lastName || !email || !password) {
        return res.status(400).json({
          success: false,
          message: "All fields are required (firstName, lastName, email, password)",
        });
      }

      if (password.length < 6) {
        return res.status(400).json({
          success: false,
          message: "Password must be at least 6 characters long",
        });
      }

      // Check if user already exists
      const existingUser = await User.findOne({ email });
      if (existingUser) {
        return res.status(400).json({
          success: false,
          message: "User with this email already exists",
        });
      }

      // Create new user
      const user = await User.create({
        firstName,
        lastName,
        email,
        password,
        isVerified: true, // No email verification required
        authProvider: "local",
      });

      // Send welcome email (non-blocking)
      EmailService.sendWelcomeEmail(email, firstName).catch(err => {
        console.error("Failed to send welcome email:", err);
      });

      const token = jwt.sign(
        {
          id: user._id,
        },
        process.env.JWT_SECRET,
        { expiresIn: process.env.JWT_EXPIRES_IN }
      );

      res.json({
        success: true,
        message: "Registration successful",
        token,
        user: {
          id: user._id,
          firstName: user.firstName,
          lastName: user.lastName,
          email: user.email,
          isVerified: user.isVerified,
          emailVerified: user.emailVerified,
          authProvider: user.authProvider,
        },
      });
    } catch (err) {
      console.error("Email registration error: ", err);
      if (err.code === 11000) {
        return res.status(400).json({
          success: false,
          message: "User with this email already exists",
        });
      }
      res.status(500).json({
        success: false,
        message: "Internal server error",
      });
    }
  }

  // Email/Password Login
  static async emailLogin(req, res) {
    try {
      const { email, password } = req.body;

      if (!email || !password) {
        return res.status(400).json({
          success: false,
          message: "Email and password are required",
        });
      }

      const user = await User.findOne({
        email,
        authProvider: "local",
        isActive: true,
      }).select("+password");

      if (!user) {
        return res.status(401).json({
          success: false,
          message: "Invalid credentials",
        });
      }

      const isPasswordValid = await user.comparePassword(password);

      if (!isPasswordValid) {
        return res.status(401).json({
          success: false,
          message: "Invalid credentials",
        });
      }

      // Check if email is verified
      if (!user.emailVerified) {
        return res.status(403).json({
          success: false,
          message: "Email not verified",
          code: "EMAIL_NOT_VERIFIED",
          email: user.email
        });
      }

      const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
        expiresIn: process.env.JWT_EXPIRES_IN,
      });

      res.json({
        success: true,
        message: "Login successful",
        token,
        user: {
          id: user._id,
          firstName: user.firstName,
          lastName: user.lastName,
          email: user.email,
          isVerified: user.isVerified,
          emailVerified: user.emailVerified,
          authProvider: user.authProvider,
        },
      });
    } catch (err) {
      console.error("Email login error: ", err);
      res.status(500).json({
        success: false,
        message: "Internal server error",
      });
    }
  }

  // Email-based Forgot Password (OTP-based)
  static async forgotPasswordEmail(req, res) {
    try {
      const { email } = req.body;

      if (!email) {
        return res.status(400).json({
          success: false,
          message: "Email is required",
        });
      }

      const user = await User.findOne({ email, authProvider: "local" });

      if (!user) {
        // Don't reveal if user exists or not for security
        return res.json({
          success: true,
          message: "If an account with that email exists, a password reset OTP has been sent",
        });
      }

      // Generate OTP for password reset
      const otp = OTPGenerator.generateOTP();
      const expiresAt = OTPGenerator.getExpiryTime();

      await OTP.create({
        email,
        otp,
        purpose: "forgot_password_email",
        expiresAt,
      });

      // Send OTP via email
      const emailResult = await EmailService.sendEmailOTP(email, otp, "Password Reset");

      if (!emailResult.success) {
        return res.status(500).json({
          success: false,
          message: "Failed to send OTP email",
        });
      }

      // In development mode, include the OTP in the response for testing
      const responseData = {
        success: true,
        message: "If an account with that email exists, a password reset OTP has been sent",
      };

      if (process.env.NODE_ENV === 'development' || !process.env.SMTP_HOST || process.env.SMTP_HOST === 'your-smtp-host') {
        responseData.devMode = true;
        responseData.otp = otp; // Include OTP in response for development
        responseData.message = "OTP logged to console (development mode)";
      }

      res.json(responseData);
    } catch (error) {
      console.error("Forgot password email error:", error);
      res.status(500).json({
        success: false,
        message: "Internal server error",
      });
    }
  }

  // Email-based Reset Password (OTP-based)
  static async resetPasswordEmail(req, res) {
    try {
      const { email, otp, newPassword } = req.body;

      if (!email || !otp || !newPassword) {
        return res.status(400).json({
          success: false,
          message: "Email, OTP and new password are required",
        });
      }

      if (newPassword.length < 6) {
        return res.status(400).json({
          success: false,
          message: "Password must be at least 6 characters long",
        });
      }

      // Verify OTP first
      const otpRecord = await OTP.findOne({
        email,
        purpose: "forgot_password_email",
        isUsed: false,
        expiresAt: { $gt: new Date() },
      }).sort({ createdAt: -1 });

      if (!otpRecord) {
        return res.status(400).json({
          success: false,
          message: "Invalid or expired OTP",
        });
      }

      if (otpRecord.attempts >= 3) {
        return res.status(400).json({
          success: false,
          message: "Too many failed attempts. Please request new OTP",
        });
      }

      if (otpRecord.otp != otp) {
        otpRecord.attempts += 1;
        await otpRecord.save();

        return res.status(400).json({
          success: false,
          message: "Invalid OTP",
        });
      }

      const user = await User.findOne({ email, authProvider: "local" });

      if (!user) {
        return res.status(404).json({
          success: false,
          message: "User not found",
        });
      }

      // Update password
      user.password = newPassword;
      await user.save();

      // Mark OTP as used
      otpRecord.isUsed = true;
      await otpRecord.save();

      // Send confirmation email (non-blocking)
      EmailService.sendPasswordChangedEmail(user.email, user.firstName).catch(err => {
        console.error("Failed to send password changed email:", err);
      });

      res.json({
        success: true,
        message: "Password reset successfully",
      });
    } catch (error) {
      console.error("Reset password email error:", error);
      res.status(500).json({
        success: false,
        message: "Internal server error",
      });
    }
  }

  // Verify Email Link
  static async verifyEmail(req, res) {
    try {
      // Get token from params (if GET) or body (if POST) - usually link is GET
      const token = req.params.token || req.body.token;

      if (!token) {
        return res.status(400).json({
          success: false,
          message: "Verification token is required",
        });
      }

      // Hash token to compare with DB
      const hashedToken = crypto.createHash('sha256').update(token).digest('hex');

      const user = await User.findOne({
        emailVerificationToken: hashedToken,
        emailVerificationExpires: { $gt: Date.now() },
      });

      if (!user) {
        return res.status(400).json({
          success: false,
          message: "Invalid or expired verification token",
        });
      }

      // Mark email as verified and clear token
      user.emailVerified = true;
      user.emailVerificationToken = undefined;
      user.emailVerificationExpires = undefined;
      await user.save();

      // For browser request (standard link click), redirect to frontend
      // The frontend URL would be: CLIENT_URL/email-verified?status=success
      const clientUrl = process.env.CLIENT_URL || 'http://localhost:5173';

      // If the request accepts JSON, return JSON (for API testing)
      if (req.headers.accept && req.headers.accept.includes('application/json')) {
        return res.json({
          success: true,
          message: "Email verified successfully",
          user: {
            id: user._id,
            email: user.email,
            emailVerified: user.emailVerified
          }
        });
      } else {
        // Redirect to frontend success page
        return res.redirect(`${clientUrl}/email-verified?success=true`);
      }
    } catch (error) {
      console.error("Email verification error:", error);
      res.status(500).json({
        success: false,
        message: "Internal server error",
      });
    }
  }

  // Resend Verification Email
  static async resendVerification(req, res) {
    try {
      const user = await User.findById(req.user.id);

      if (!user) {
        return res.status(404).json({
          success: false,
          message: "User not found",
        });
      }

      if (user.emailVerified) {
        return res.status(400).json({
          success: false,
          message: "Email is already verified",
        });
      }

      if (!user.email) {
        return res.status(400).json({
          success: false,
          message: "No email address associated with this account",
        });
      }

      // Generate verification token
      const verificationToken = crypto.randomBytes(32).toString('hex');
      user.emailVerificationToken = crypto.createHash('sha256').update(verificationToken).digest('hex');
      user.emailVerificationExpires = Date.now() + 24 * 60 * 60 * 1000; // 24 hours

      await user.save();

      // Send verification email
      const clientVerifyURL = `${process.env.CLIENT_URL || 'http://localhost:5173'}/verify-email?token=${verificationToken}`;

      EmailService.sendWelcomeEmail(user.email, user.firstName, clientVerifyURL).catch(err => {
        console.error("Failed to resend verification email:", err);
      });

      res.json({
        success: true,
        message: "Verification email sent successfully",
      });
    } catch (error) {
      console.error("Resend verification error:", error);
      res.status(500).json({
        success: false,
        message: "Internal server error",
      });
    }
  }

  // Resend Verification Email (Public - for users who can't login yet)
  static async resendVerificationPublic(req, res) {
    try {
      const { email } = req.body;

      if (!email) {
        return res.status(400).json({
          success: false,
          message: "Email is required",
        });
      }

      const user = await User.findOne({ email });

      // Security: Don't reveal if user exists, but if they do and are unverified, send email
      if (user && !user.emailVerified) {
        // Generate verification token
        const verificationToken = crypto.randomBytes(32).toString('hex');
        user.emailVerificationToken = crypto.createHash('sha256').update(verificationToken).digest('hex');
        user.emailVerificationExpires = Date.now() + 24 * 60 * 60 * 1000; // 24 hours

        await user.save();

        // Send verification email
        const clientVerifyURL = `${process.env.CLIENT_URL || 'http://localhost:5173'}/verify-email?token=${verificationToken}`;

        EmailService.sendWelcomeEmail(user.email, user.firstName, clientVerifyURL).catch(err => {
          console.error("Failed to resend public verification email:", err);
        });
      }

      // Always return success to prevent email enumeration
      res.json({
        success: true,
        message: "If an account exists with this email, a verification link has been sent.",
      });
    } catch (error) {
      console.error("Resend public verification error:", error);
      res.status(500).json({
        success: false,
        message: "Internal server error",
      });
    }
  }

  // Get current user profile
  static async getProfile(req, res) {
    try {
      res.json({
        success: true,
        user: {
          id: req.user._id,
          firstName: req.user.firstName,
          lastName: req.user.lastName,
          mobileNumber: req.user.mobileNumber,
          email: req.user.email,
          isVerified: req.user.isVerified,
          emailVerified: req.user.emailVerified,
          authProvider: req.user.authProvider,
          createdAt: req.user.createdAt,
        },
      });
    } catch (error) {
      console.error("Get profile error:", error);
      res.status(500).json({
        success: false,
        message: "Internal server error",
      });
    }
  }

  // Request Email OTP for verification
  static async requestEmailOTP(req, res) {
    try {
      const { email, purpose = "email_verification" } = req.body;
      if (!email) {
        return res.status(400).json({
          success: false,
          message: "Email is required",
        });
      }

      if (purpose == "email_verification") {
        const existingUser = await User.findOne({ email });
        if (existingUser && existingUser.isVerified) {
          return res.status(400).json({
            success: false,
            message: "Email is already verified",
          });
        }
      }

      const otp = OTPGenerator.generateOTP();
      const expiresAt = OTPGenerator.getExpiryTime();

      await OTP.create({
        email,
        otp,
        purpose,
        expiresAt,
      });

      const emailResult = await EmailService.sendEmailOTP(email, otp);
      if (!emailResult.success) {
        return res.status(500).json({
          success: false,
          message: "Failed to send OTP email",
        });
      }

      // In development mode, include the OTP in the response for testing
      const responseData = {
        success: true,
        message: "OTP sent successfully to your email",
        purpose,
      };

      if (process.env.NODE_ENV === 'development' || !process.env.SMTP_HOST || process.env.SMTP_HOST === 'your-smtp-host') {
        responseData.devMode = true;
        responseData.otp = otp; // Include OTP in response for development
        responseData.message = "OTP logged to console (development mode)";
      }

      return res.json(responseData);
    } catch (err) {
      console.error("Email OTP request error: ", err);
      res.status(500).json({
        success: false,
        message: "Internal server error",
      });
    }
  }

  // Verify Email OTP
  static async verifyEmailOTP(req, res) {
    try {
      const { email, otp, purpose = "email_verification" } = req.body;

      if (!email || !otp) {
        return res.status(400).json({
          success: false,
          message: "Email and OTP are required",
        });
      }

      const otpRecord = await OTP.findOne({
        email,
        purpose,
        isUsed: false,
        expiresAt: { $gt: new Date() },
      }).sort({ createdAt: -1 });

      if (!otpRecord) {
        return res.status(400).json({
          success: false,
          message: "Invalid or expired OTP",
        });
      }

      if (otpRecord.attempts >= 3) {
        return res.status(400).json({
          success: false,
          message: "Too many failed attempts. Please request new OTP",
        });
      }

      if (otpRecord.otp != otp) {
        otpRecord.attempts += 1;
        await otpRecord.save();

        return res.status(400).json({
          success: false,
          message: "Invalid OTP",
        });
      }

      otpRecord.isUsed = true;
      await otpRecord.save();

      let user;

      if (purpose === "email_verification") {
        user = await User.findOneAndUpdate(
          { email },
          { isVerified: true },
          { new: true, upsert: true }
        );
      }

      res.json({
        success: true,
        message: "OTP verified successfully",
        user:
          purpose === "email_verification"
            ? {
              id: user._id,
              email: user.email,
              isVerified: user.isVerified,
            }
            : undefined,
        purpose,
      });
    } catch (err) {
      console.error("Email OTP verification error: ", err);
      return res.status(500).json({
        success: false,
        message: "Internal server error",
      });
    }
  }

  // Email Registration with OTP Verification
  static async emailRegisterWithOTP(req, res) {
    try {
      const { firstName, lastName, email, password, otp } = req.body;

      if (!firstName || !lastName || !email || !password || !otp) {
        return res.status(400).json({
          success: false,
          message: "All fields are required (firstName, lastName, email, password, otp)",
        });
      }

      if (password.length < 6) {
        return res.status(400).json({
          success: false,
          message: "Password must be at least 6 characters long",
        });
      }

      // Verify OTP first
      const otpRecord = await OTP.findOne({
        email,
        purpose: "email_verification",
        isUsed: false,
        expiresAt: { $gt: new Date() },
      }).sort({ createdAt: -1 });

      if (!otpRecord) {
        return res.status(400).json({
          success: false,
          message: "Invalid or expired OTP",
        });
      }

      if (otpRecord.attempts >= 3) {
        return res.status(400).json({
          success: false,
          message: "Too many failed attempts. Please request new OTP",
        });
      }

      if (otpRecord.otp != otp) {
        otpRecord.attempts += 1;
        await otpRecord.save();

        return res.status(400).json({
          success: false,
          message: "Invalid OTP",
        });
      }

      // Check if user already exists
      const existingUser = await User.findOne({ email });
      if (existingUser) {
        if (existingUser.isVerified) {
          return res.status(400).json({
            success: false,
            message: "User with this email already exists and is verified.",
          });
        }
      }

      // Mark OTP as used
      otpRecord.isUsed = true;
      await otpRecord.save();

      // Create or update user
      let user;
      if (existingUser) {
        // Update existing unverified user
        user = await User.findOneAndUpdate(
          { email },
          {
            firstName,
            lastName,
            password,
            isVerified: true,
            authProvider: "local",
            updatedAt: Date.now()
          },
          { new: true }
        );
      } else {
        // Create new user
        user = await User.create({
          firstName,
          lastName,
          email,
          password,
          isVerified: true,
          authProvider: "local",
        });
      }

      // Send welcome email (non-blocking)
      EmailService.sendWelcomeEmail(email, firstName).catch(err => {
        console.error("Failed to send welcome email:", err);
      });

      const token = jwt.sign(
        {
          id: user._id,
        },
        process.env.JWT_SECRET,
        { expiresIn: process.env.JWT_EXPIRES_IN }
      );

      res.json({
        success: true,
        message: "Registration successful",
        token,
        user: {
          id: user._id,
          firstName: user.firstName,
          lastName: user.lastName,
          email: user.email,
          isVerified: user.isVerified,
          authProvider: user.authProvider,
        },
      });
    } catch (err) {
      console.error("Email registration with OTP error: ", err);
      if (err.code === 11000) {
        return res.status(400).json({
          success: false,
          message: "User with this email already exists",
        });
      }
      res.status(500).json({
        success: false,
        message: "Internal server error",
      });
    }
  }
}

export default AuthController;

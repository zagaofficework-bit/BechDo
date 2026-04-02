const jwt = require("jsonwebtoken");
const crypto = require("crypto");
const userModel = require("../models/user.model");
const {
  generateAccessToken,
  generateRefreshToken,
  generateOTP,
} = require("../helper/auth.helper");
const emailService = require("../service/email.service");
const redisClient = require("../config/redis.client");

// Redis key generators
const OTP_KEY              = (email) => `otp:${email}`;
const BLACKLIST_KEY        = (token) => `blacklist:${token}`;
const REGISTER_SESSION_KEY = (token) => `register_session:${token}`;
const LOGIN_SESSION_KEY    = (token) => `login_session:${token}`;

const OTP_TTL_SECONDS = 1 * 60;

/**
 * @name userRegisterController
 * @description Handles user registration by generating an OTP, storing it in Redis, and sending it via email. Implements rate-limiting to prevent abuse.
 * @route POST /api/auth/register
 * @access Public
 */

async function userRegisterController(req, res) {
  try {
    const { email, firstname, lastname, mobile } = req.body;

    // 1. Check duplicate mobile & email in parallel
    const [mobileExists, emailExists] = await Promise.all([
      userModel.findOne({ mobile }).lean(),
      userModel.findOne({ email }).lean(),
    ]);

    if (mobileExists) {
      return res.status(422).json({
        message: "User already exists with this mobile",
      });
    }

    if (emailExists) {
      return res.status(422).json({
        message: "User already exists with this email",
      });
    }

    // 2. Rate-limit: block resend if a fresh OTP already exists
    const existing = await redisClient.get(OTP_KEY(email));
    if (existing) {
      return res.status(429).json({
        message: "OTP already sent. Please wait before requesting again",
      });
    }

    // 3. Generate OTP and session token
    const otp          = generateOTP();
    const sessionToken = crypto.randomUUID();

    // 4. Store OTP + session mapping in Redis in parallel
    await Promise.all([
      redisClient.setEx(
        OTP_KEY(email),
        OTP_TTL_SECONDS,
        JSON.stringify({ otp, userData: { email, firstname, lastname, mobile } })
      ),
      redisClient.setEx(
        REGISTER_SESSION_KEY(sessionToken),
        OTP_TTL_SECONDS,
        email
      ),
    ]);

    // 5. Send OTP email
    await emailService.sendRegistrationEmail(email, firstname, otp);

    res.status(200).json({
      message: "OTP sent to your email for verification",
      sessionToken,
    });
  } catch (error) {
    console.error("userRegisterController error:", error);
    res.status(500).json({ message: "Registration failed. Please try again" });
  }
}


/**
 * @name verifyRegisterOtpController
 * @description Verify OTP and create user
 * @route POST /api/auth/register/verify-otp
 * @access Public
 */
async function verifyRegisterOtpController(req, res) {
  try {
    const { otp, sessionToken } = req.body;

    // 1. Resolve email from session token
    const email = await redisClient.get(REGISTER_SESSION_KEY(sessionToken));
    if (!email) {
      return res.status(400).json({
        message: "Session expired. Please register again",
      });
    }

    // 2. Fetch OTP record from Redis
    const raw = await redisClient.get(OTP_KEY(email));
    if (!raw) {
      return res.status(400).json({
        message: "OTP expired or not found. Please register again",
      });
    }

    const record = JSON.parse(raw);

    // 3. Validate OTP
    if (record.otp !== otp) {
      return res.status(400).json({ message: "Invalid OTP" });
    }

    // 4. Create user
    const user = await userModel.create({
      ...record.userData,
      isVerified: true,
    });

    // 5. Cleanup both Redis keys in parallel
    await Promise.all([
      redisClient.del(OTP_KEY(email)),
      redisClient.del(REGISTER_SESSION_KEY(sessionToken)),
    ]);

    // 6. Generate tokens
    const accessToken  = generateAccessToken(user._id);
    const refreshToken = generateRefreshToken(user._id);

    // 7. Persist refresh token on user doc
    user.refreshToken = refreshToken;
    await user.save();

    // 8. Set secure cookie
    res.cookie("refreshToken", refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
    });

    // 9. Return response — exclude sensitive fields
    const userObj = user.toObject();
    delete userObj.refreshToken;

    res.status(201).json({
      message: "User registered successfully",
      accessToken,
      user: userObj,
    });
  } catch (error) {
    console.error("verifyRegisterOtpController error:", error);
    res.status(500).json({ message: "OTP verification failed. Please try again" });
  }
}


/**
 * @name userLoginController
 * @description Initiate user login by sending an OTP to the provided email
 * @route POST /api/auth/login
 * @access Public
 */
async function userLoginController(req, res) {
  try {
    const { email } = req.body;

    // 1. Find user — only fetch fields we need
    const user = await userModel
      .findOne({ email })
      .select("_id email firstname")
      .lean();

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // 2. Rate-limit: block resend if a fresh OTP already exists
    const existing = await redisClient.get(OTP_KEY(email));
    if (existing) {
      return res.status(429).json({
        message: "OTP already sent. Please wait before requesting again",
      });
    }

    // 3. Generate OTP and session token
    const otp          = generateOTP();
    const sessionToken = crypto.randomUUID();

    // 4. Store OTP + session mapping in Redis in parallel
    await Promise.all([
      redisClient.setEx(
        OTP_KEY(email),
        OTP_TTL_SECONDS,
        JSON.stringify({ otp, userId: user._id.toString() })
      ),
      redisClient.setEx(
        LOGIN_SESSION_KEY(sessionToken),
        OTP_TTL_SECONDS,
        email
      ),
    ]);

    // 5. Send OTP email
    await emailService.sendLoginEmail(user.email, otp);

    res.status(200).json({
      message: "OTP sent to your email",
      sessionToken,
    });
  } catch (error) {
    console.error("userLoginController error:", error);
    res.status(500).json({ message: "Login failed. Please try again" });
  }
}


/**
 * @name verifyLoginOtpController
 * @description Verify OTP and login user
 * @route POST /api/auth/login/verify-otp
 * @access Public
 */
async function verifyLoginOtpController(req, res) {
  try {
    const { otp, sessionToken } = req.body;

    // 1. Resolve email from session token
    const email = await redisClient.get(LOGIN_SESSION_KEY(sessionToken));
    if (!email) {
      return res.status(400).json({
        message: "Session expired. Please login again",
      });
    }

    // 2. Fetch OTP record from Redis
    const raw = await redisClient.get(OTP_KEY(email));
    if (!raw) {
      return res.status(400).json({
        message: "OTP expired or not found. Please login again",
      });
    }

    const record = JSON.parse(raw);

    // 3. Validate OTP
    if (record.otp !== otp) {
      return res.status(400).json({ message: "Invalid OTP" });
    }

    // 4. Fetch user
    const user = await userModel.findById(record.userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // 5. Cleanup both Redis keys in parallel
    await Promise.all([
      redisClient.del(OTP_KEY(email)),
      redisClient.del(LOGIN_SESSION_KEY(sessionToken)),
    ]);

    // 6. Generate tokens
    const accessToken  = generateAccessToken(user._id);
    const refreshToken = generateRefreshToken(user._id);

    // 7. Persist refresh token
    user.refreshToken = refreshToken;
    await user.save();

    // 8. Set secure cookie
    res.cookie("refreshToken", refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
    });

    // 9. Return response — exclude sensitive fields
    const userObj = user.toObject();
    delete userObj.refreshToken;

    res.status(200).json({
      message: "Login successful",
      accessToken,
      user: userObj,
    });
  } catch (error) {
    console.error("verifyLoginOtpController error:", error);
    res.status(500).json({ message: "OTP verification failed. Please try again" });
  }
}


/**
 * @name userLogoutController
 * @description Logout user and invalidate refresh token
 * @route POST /api/auth/logout
 * @access Private
 */
async function userLogoutController(req, res) {
  try {
    const accessToken  = req.token;
    const refreshToken = req.cookies.refreshToken;

    const blacklistPromises = [];

    if (accessToken) {
      const decoded = jwt.decode(accessToken);
      const ttl = decoded?.exp
        ? decoded.exp - Math.floor(Date.now() / 1000)
        : 900;
      if (ttl > 0) {
        blacklistPromises.push(
          redisClient.setEx(BLACKLIST_KEY(accessToken), ttl, "1")
        );
      }
    }

    if (refreshToken) {
      const decoded = jwt.decode(refreshToken);
      const ttl = decoded?.exp
        ? decoded.exp - Math.floor(Date.now() / 1000)
        : 60 * 60 * 24 * 7;
      if (ttl > 0) {
        blacklistPromises.push(
          redisClient.setEx(BLACKLIST_KEY(refreshToken), ttl, "1")
        );
      }
    }

    await Promise.all(blacklistPromises);

    if (req.user?._id) {
      await userModel.findByIdAndUpdate(req.user._id, { refreshToken: null });
    }

    res.clearCookie("refreshToken", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
    });

    res.status(200).json({ message: "User logged out successfully" });
  } catch (error) {
    console.error("userLogoutController error:", error);
    res.status(500).json({ message: "Logout failed. Please try again" });
  }
}


/**
 * @name refreshAccessTokenController
 * @description Refresh access token using refresh token
 * @route POST /api/auth/refresh-token
 * @access Private
 */
async function refreshAccessTokenController(req, res) {
  try {
    const refreshToken = req.cookies.refreshToken;

    if (!refreshToken) {
      return res.status(401).json({ message: "Refresh token missing" });
    }

    const isBlacklisted = await redisClient.get(BLACKLIST_KEY(refreshToken));
    if (isBlacklisted) {
      return res.status(401).json({
        message: "Refresh token has been invalidated. Please login again",
      });
    }

    const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);

    const user = await userModel
      .findById(decoded.userId)
      .select("refreshToken");

    if (!user || user.refreshToken !== refreshToken) {
      return res.status(401).json({
        message: "Invalid refresh token. Please login again",
      });
    }

    const newAccessToken = generateAccessToken(user._id);

    res.status(200).json({ accessToken: newAccessToken });
  } catch (error) {
    console.error("refreshAccessTokenController error:", error);

    if (error.name === "TokenExpiredError") {
      return res.status(401).json({
        message: "Refresh token expired. Please login again",
        code: "REFRESH_TOKEN_EXPIRED",
      });
    }

    res.status(401).json({ message: "Invalid refresh token" });
  }
}


async function getMeController(req, res) {
  try {
    // req.user is set by authMiddleware
    const user = await userModel
      .findById(req.user._id)
      .select("-refreshToken")
      .lean();

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res.status(200).json({ user });
  } catch (error) {
    console.error("getMeController error:", error);
    res.status(500).json({ message: "Failed to fetch user" });
  }
}

module.exports = {
  userRegisterController,
  verifyRegisterOtpController,
  userLoginController,
  verifyLoginOtpController,
  userLogoutController,
  refreshAccessTokenController,
  getMeController,
};
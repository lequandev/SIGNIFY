import { Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { OAuth2Client } from 'google-auth-library';
import User from '../models/userModel';
import sendEmail from '../utils/emailService';

const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

const JWT_SECRET = process.env.JWT_SECRET || 'your_super_secret_jwt_key';
const JWT_EXPIRES_IN = '7d';

const generateToken = (id: string) => {
  return jwt.sign({ id }, JWT_SECRET, {
    expiresIn: JWT_EXPIRES_IN,
  });
};

// @desc Register a new user
// @route POST /api/users/register
// @access Public
export const registerUser = async (req: Request, res: Response) => {
  const { fullName, email, password, phoneNumber, address } = req.body;

  try {
    const userExists = await User.findOne({ email });

    if (userExists) {
      return res.status(400).json({ message: 'User already exists' });
    }

    const verificationToken = crypto.randomBytes(32).toString('hex');
    const user = await User.create({
      fullName,
      email,
      password,
      phoneNumber,
      address,
      verificationToken,
    });

    if (user) {
      const verificationUrl = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/verify-email/${verificationToken}`;
      const emailContent = `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eee; border-radius: 10px;">
          <h2 style="color: #4F46E5;">Welcome to Signify!</h2>
          <p>Please verify your email address to get started with our video accessibility suite.</p>
          <a href="${verificationUrl}" style="display: inline-block; padding: 12px 24px; background-color: #4F46E5; color: white; text-decoration: none; rounded: 5px; font-weight: bold;">Verify Email Address</a>
          <p style="margin-top: 20px; color: #666; font-size: 14px;">If the button doesn't work, copy and paste this link into your browser: <br/> ${verificationUrl}</p>
        </div>
      `;

      await sendEmail(user.email, 'Verify your Signify account', emailContent);

      res.status(201).json({
        message: 'Registration successful. Please check your email to verify your account.',
      });
    } else {
      res.status(400).json({ message: 'Invalid user data' });
    }
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

// @desc Authenticate a user & get token
// @route POST /api/users/login
// @access Public
export const loginUser = async (req: Request, res: Response) => {
  const { email, password } = req.body;

  try {
    const user = await User.findOne({ email });

    if (user && (await user.comparePassword(password))) {
      if (!user.isVerified) {
        return res.status(401).json({ message: 'Please verify your email to login' });
      }
      res.json({
        _id: user._id,
        fullName: user.fullName,
        email: user.email,
        token: generateToken(String(user._id)),
      });
    } else {
      res.status(401).json({ message: 'Invalid email or password' });
    }
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};
// @desc Verify email
// @route GET /api/users/verify/:token
// @access Public
export const verifyEmail = async (req: Request, res: Response) => {
  const { token } = req.params;
  console.log('Verifying token:', token);

  try {
    const user = await User.findOne({ verificationToken: token });

    if (!user) {
      return res.status(400).json({ message: 'Invalid or expired verification token' });
    }

    user.isVerified = true;
    user.verificationToken = undefined;
    await user.save();

    res.json({ message: 'Email verified successfully! You can now login.' });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

// @desc Google Login
// @route POST /api/users/google-login
// @access Public
export const googleLogin = async (req: Request, res: Response) => {
  const { credential } = req.body;

  try {
    const ticket = await client.verifyIdToken({
      idToken: credential,
      audience: process.env.GOOGLE_CLIENT_ID,
    });

    const payload = ticket.getPayload();
    if (!payload || !payload.email) {
      return res.status(400).json({ message: 'Invalid Google token' });
    }

    const { email, name, sub: googleId } = payload;

    let user = await User.findOne({ email });

    if (user) {
      // If user exists but doesn't have googleId, link it
      if (!user.googleId) {
        user.googleId = googleId;
        user.isVerified = true; // Google emails are verified
        await user.save();
      }
    } else {
      // Create new user
      user = await User.create({
        fullName: name || 'Google User',
        email,
        googleId,
        isVerified: true,
      });
    }

    res.json({
      _id: user._id,
      fullName: user.fullName,
      email: user.email,
      token: generateToken(String(user._id)),
    });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

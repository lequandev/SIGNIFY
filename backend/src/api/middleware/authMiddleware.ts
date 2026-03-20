import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import User from '../models/userModel';

export interface AuthRequest extends Request {
  user?: any;
}

export const authMiddleware = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const authHeader = req.header('Authorization');
    console.log('Incoming Auth Header:', authHeader);
    
    const token = authHeader?.replace('Bearer ', '');

    if (!token) {
      console.log('Auth Failed: Token Missing');
      return res.status(401).json({ message: 'Authentication required' });
    }

    const secret = process.env.JWT_SECRET || 'your_jwt_secret_key';
    const decoded: any = jwt.verify(token, secret);
    console.log('Token Decoded Successfully. ID:', decoded.id);
    
    const user = await User.findById(decoded.id);

    if (!user) {
      console.log('Auth Failed: User not found for ID:', decoded.id);
      return res.status(401).json({ message: 'User not found' });
    }

    console.log('Auth Success: User', user.email);
    req.user = user;
    next();
  } catch (error: any) {
    console.log('Auth Failed: JWT Verify Error:', error.message);
    res.status(401).json({ message: 'Invalid token' });
  }
};

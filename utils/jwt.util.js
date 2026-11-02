import jwt from 'jsonwebtoken';
import { JWT_SECRET } from '../config/env.js';

export const generateToken = (id) =>
  jwt.sign({ id }, JWT_SECRET, {
    expiresIn: '30d',
  });

export const verifyToken = (token) => jwt.verify(token, JWT_SECRET);
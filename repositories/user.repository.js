import { User } from '../model/user.model.js';

export const escapeRegex = (str = '') =>
  String(str).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

export const findById = (id) =>
  User.findById(id).select('-password');

export const findByEmail = (email) =>
  User.findOne({ email });

export const findByUsername = (username, limit = 20) => {
  const safePattern = escapeRegex(username.trim());
  return User.find({ username: { $regex: safePattern, $options: 'i' } })
    .select('_id username email')
    .limit(limit);
};

export const createUser = (data) => User.create(data);

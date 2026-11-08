import {
  findById,
  findByIdWithPassword,
  findByEmail,
  findOneByUsername,
  createUser,
  findByUsername,
  updateUserById,
} from '../repositories/user.repository.js';
import { findGroupIdsByMember } from '../repositories/group.repository.js';
import { generateToken } from '../utils/jwt.util.js';
import {
  badRequest,
  conflict,
  notFound,
  unauthorized,
} from '../utils/error.util.js';

const formatUser = (user) => ({
  _id: user._id,
  username: user.username,
  email: user.email,
  displayName: user.displayName || '',
  avatar: user.avatar || '',
  bio: user.bio || '',
  title: user.title || '',
  statusText: user.statusText || '',
  phone: user.phone || '',
  isAdmin: Boolean(user.isAdmin),
  createdAt: user.createdAt,
  updatedAt: user.updatedAt,
});

const formatAuthUser = (user) => ({
  ...formatUser(user),
  token: generateToken(user._id),
});

export const register = async ({ username, email, password }) => {
  const [foundUsername, exists] = await Promise.all([
    findOneByUsername(username),
    findByEmail(email),
  ]);

  if (foundUsername) {
    throw conflict('Username Already Taken');
  }
  if (exists) {
    throw conflict('Email Already Used');
  }
  const user = await createUser({ username, email, password });
  return formatAuthUser(user);
};

export const login = async ({ email, password }) => {
  const user = await findByEmail(email);
  if (!user || !(await user.matchPassword(password))) {
    throw unauthorized('Invalid email or password');
  }
  return formatAuthUser(user);
};

export const searchByUsername = (username) => findByUsername(username);

export const getProfile = async (userId) => {
  const user = await findById(userId);
  if (!user) {
    throw notFound('User not found');
  }
  return formatUser(user);
};

export const updateProfile = async (userId, payload = {}, io) => {
  const user = await findByIdWithPassword(userId);
  if (!user) {
    throw notFound('User not found');
  }

  const {
    username,
    email,
    displayName,
    avatar,
    bio,
    title,
    statusText,
    phone,
    currentPassword,
    newPassword,
  } = payload;

  if (email && email.toLowerCase() !== user.email.toLowerCase()) {
    const existing = await findByEmail(email.toLowerCase());
    if (existing && String(existing._id) !== String(user._id)) {
      throw conflict('Email is already in use by another account');
    }
    user.email = email.toLowerCase().trim();
  }

  if (typeof username === 'string' && username.trim()) {
    const trimmedUsername = username.trim();
    if (trimmedUsername.toLowerCase() !== user.username.toLowerCase()) {
      const existingUsername = await findOneByUsername(trimmedUsername);
      if (existingUsername && String(existingUsername._id) !== String(user._id)) {
        throw conflict('Username is already taken by another account');
      }
    }
    user.username = trimmedUsername;
  }
  if (typeof displayName === 'string') {
    user.displayName = displayName.trim();
  }
  if (typeof avatar === 'string') {
    user.avatar = avatar;
  }
  if (typeof bio === 'string') {
    user.bio = bio.trim();
  }
  if (typeof title === 'string') {
    user.title = title.trim();
  }
  if (typeof statusText === 'string') {
    user.statusText = statusText.trim();
  }
  if (typeof phone === 'string') {
    user.phone = phone.trim();
  }

  if (newPassword) {
    if (!currentPassword) {
      throw badRequest('Current password is required to set a new password');
    }
    const isMatch = await user.matchPassword(currentPassword);
    if (!isMatch) {
      throw unauthorized('Current password is incorrect');
    }
    user.password = newPassword;
  }

  await user.save();
  const formatted = formatUser(user);

  if (io) {
    const uid = String(user._id);
    io.to(`user_${uid}`).emit('user_updated', formatted);
    try {
      const groups = await findGroupIdsByMember(user._id);
      for (const g of groups) {
        io.to(String(g._id)).emit('user_updated', formatted);
      }
    } catch {
      // Non-fatal socket broadcast fallback
    }
  }

  return formatted;
};

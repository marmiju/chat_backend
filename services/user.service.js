import {
  findByEmail,
  createUser,
  findByUsername,
} from '../repositories/user.repository.js';
import { generateToken } from '../utils/jwt.util.js';
import { conflict, unauthorized } from '../utils/error.util.js';

const formatAuthUser = (user) => ({
  _id: user._id,
  username: user.username,
  email: user.email,
  token: generateToken(user._id),
});

export const register = async ({ username, email, password }) => {
  const exists = await findByEmail(email);
  if (exists) {
    throw conflict('Email already exists');
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

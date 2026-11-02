import { findById } from '../repositories/user.repository.js';
import { assertGroupExists, isAdminOfGroup } from '../services/group.service.js';
import { verifyToken } from '../utils/jwt.util.js';
import { forbidden, unauthorized } from '../utils/error.util.js';
import { asyncHandler } from '../utils/async.util.js';

const extractBearerToken = (authorizationHeader = '') =>
  authorizationHeader.startsWith('Bearer ')
    ? authorizationHeader.split(' ')[1]
    : null;

export const authenticateToken = async (token) => {
  if (!token) {
    throw unauthorized('Not authorized, token missing or invalid!');
  }
  try {
    const decoded = verifyToken(token);
    const user = await findById(decoded.id);
    if (!user) {
      throw unauthorized('Not authorized, user not found');
    }
    return user;
  } catch (err) {
    if (err.statusCode === 401) throw err;
    throw unauthorized('Not authorized, token failed!');
  }
};

export const protect = asyncHandler(async (req, _res, next) => {
  const token = extractBearerToken(req.headers.authorization);
  req.user = await authenticateToken(token);
  if (!req.user) {
    throw unauthorized('Not authorized, user not found');
  }
  next();
});

export const isAdmin = asyncHandler(async (req, _res, next) => {
  const groupId = req.params.group_id || req.params.groupId;
  const group = await assertGroupExists(groupId);

  if (!req.user || !isAdminOfGroup(group, req.user._id)) {
    throw forbidden('Not authorized, only admin');
  }

  req.group = group;
  next();
});

import * as userService from '../services/user.service.js';
import {
  getVapidKeys,
  subscribeUserPushService,
  unsubscribeUserPushService,
} from '../services/push.service.js';
import { asyncHandler } from '../utils/async.util.js';

export const registerUser = asyncHandler(async (req, res) => {

  const user = await userService.register(req.validated.body);
  res.status(201).json(user);
});

export const loginUser = asyncHandler(async (req, res) => {
  const data = await userService.login(req.validated.body);
  res.json(data);
});

export const searchUser = asyncHandler(async (req, res) => {
  const { username } = req.validated?.query || req.query;
  const users = await userService.searchByUsername(username);
  res.json(users);
});

export const getCurrentUserProfile = asyncHandler(async (req, res) => {
  const profile = await userService.getProfile(req.user._id);
  res.json(profile);
});

export const updateCurrentUserProfile = asyncHandler(async (req, res) => {
  const payload = req.validated?.body || req.body;
  const updated = await userService.updateProfile(
    req.user._id,
    payload,
    req.io
  );
  res.json(updated);
});

export const getVapidPublicKey = asyncHandler(async (_req, res) => {
  const { publicKey } = getVapidKeys();
  res.json({ publicKey });
});

export const subscribePush = asyncHandler(async (req, res) => {
  const result = await subscribeUserPushService(req.user._id, req.body);
  res.status(201).json(result);
});

export const unsubscribePush = asyncHandler(async (req, res) => {
  const { endpoint } = req.body || {};
  const result = await unsubscribeUserPushService(req.user._id, endpoint);
  res.json(result);
});


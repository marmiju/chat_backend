import * as userService from '../services/user.service.js';
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

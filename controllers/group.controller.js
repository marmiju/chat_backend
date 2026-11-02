import {
  createGroupService,
  startDirectMessageService,
  getUserGroupsService,
  getGroupByIdService,
  addMemberToGroupService,
  leaveGroupService,
  deleteGroupService,
} from '../services/group.service.js';
import { asyncHandler } from '../utils/async.util.js';

const resolveGroupId = (params = {}) => params.groupId || params.group_id;

export const createGroup = asyncHandler(async (req, res) => {
  const { name, description = '' } = req.validated?.body || req.body;
  const createdGroup = await createGroupService({
    name,
    description,
    userId: req.user._id,
    io: req.io,
  });
  return res.status(201).json(createdGroup);
});

export const startDirectMessage = asyncHandler(async (req, res) => {
  const targetUserId =
    req.params.targetUserId ||
    req.params.userId ||
    req.body?.targetUserId ||
    req.body?.userId;
  const dmGroup = await startDirectMessageService({
    actor: req.user,
    targetUserId,
    io: req.io,
  });
  return res.status(200).json(dmGroup);
});

export const getUserGroups = asyncHandler(async (req, res) => {
  const groups = await getUserGroupsService(req.user._id);
  return res.status(200).json(groups);
});

export const getGroupById = asyncHandler(async (req, res) => {
  const group = await getGroupByIdService(resolveGroupId(req.params));
  return res.status(200).json(group);
});

export const joinGroup = asyncHandler(async (req, res) => {
  const groupId = resolveGroupId(req.params);
  const targetUserId = req.params.userId || req.user._id.toString();

  const { group } = await addMemberToGroupService({
    groupId,
    targetUserId,
    actor: req.user,
    io: req.io,
  });

  return res.status(200).json({
    message: 'User added to group',
    group,
  });
});

export const leaveGroup = asyncHandler(async (req, res) => {
  const groupId = resolveGroupId(req.params);
  await leaveGroupService({
    groupId,
    user: req.user,
    io: req.io,
  });
  return res.status(200).json({ message: 'Left group successfully' });
});

export const deleteGroup = asyncHandler(async (req, res) => {
  const groupId = resolveGroupId(req.params);
  const group = await deleteGroupService({
    groupId,
    io: req.io,
  });
  return res.status(200).json({
    message: 'Group deleted successfully',
    group,
  });
});


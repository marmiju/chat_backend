import {
  createGroupRepo,
  findGroupById,
  findPopulatedGroupById,
  findGroupsByMember,
  findGroupIdsByMember,
  addMemberToGroupRepo,
  removeMemberFromGroupRepo,
  deleteGroupByIdRepo,
  findDirectGroupBetweenUsersRepo,
  createDirectGroupRepo,
} from '../repositories/group.repository.js';
import { findById as findUserById } from '../repositories/user.repository.js';
import {
  createNotificationRepo,
  deleteMessagesByGroupRepo,
} from '../repositories/chat.repository.js';
import { getUserSockets } from './presence.service.js';
import { sendPushNotificationToUsers } from './push.service.js';
import {
  badRequest,
  conflict,
  forbidden,
  notFound,
} from '../utils/error.util.js';

export const toIdString = (entity) =>
  (entity?._id ?? entity)?.toString() ?? '';

export const isMemberOfGroup = (group, userId) =>
  Boolean(
    group?.members?.some((member) => toIdString(member) === toIdString(userId))
  );

export const isAdminOfGroup = (group, userId) =>
  Boolean(group?.admin && toIdString(group.admin) === toIdString(userId));

export const assertGroupExists = async (groupId) => {
  const group = await findGroupById(groupId);
  if (!group) {
    throw notFound('Group not found');
  }
  return group;
};

export const createGroupService = async ({
  name,
  description = '',
  userId,
  io,
}) => {
  const createdGroup = await createGroupRepo(name, description, userId);

  if (io) {
    io.to(`user_${toIdString(userId)}`).emit('group_created', createdGroup);
  }

  return createdGroup;
};

export const startDirectMessageService = async ({
  actor,
  targetUserId,
  io,
}) => {
  const actorId = toIdString(actor?._id || actor);
  const targetId = toIdString(targetUserId);

  if (!actorId || !targetId) {
    throw badRequest('Both users are required for direct message');
  }
  if (actorId === targetId) {
    throw badRequest('Cannot start a direct message with yourself');
  }

  const targetUser = await findUserById(targetId);
  if (!targetUser) {
    throw notFound('Target user not found');
  }

  let dmGroup = await findDirectGroupBetweenUsersRepo(actorId, targetId);
  const isNew = !dmGroup;

  if (!dmGroup) {
    const actorName = actor?.username || 'user';
    dmGroup = await createDirectGroupRepo({
      userAId: actorId,
      userBId: targetId,
      name: `dm-${actorName}-${targetUser.username}`,
      description: `Direct conversation between @${actorName} and @${targetUser.username}`,
    });
  }

  if (io && dmGroup) {
    const room = toIdString(dmGroup._id);
    const actorRoom = `user_${actorId}`;
    const targetRoom = `user_${targetId}`;
    io.in(actorRoom).socketsJoin(room);
    io.in(targetRoom).socketsJoin(room);

    if (isNew) {
      io.to(actorRoom).emit('group_created', dmGroup);
      io.to(targetRoom).emit('added_to_group', dmGroup);
    }
  }

  return dmGroup;
};

export const getUserGroupsService = (userId) => findGroupsByMember(userId);

export const getGroupByIdService = async (groupId) => {
  const group = await findPopulatedGroupById(groupId);
  if (!group) {
    throw notFound('Group not found');
  }
  return group;
};

export const addMemberToGroupService = async ({
  groupId,
  targetUserId,
  actor,
  targetUsername,
  io,
}) => {
  if (!groupId || !targetUserId) {
    throw badRequest('Invalid data');
  }

  const group = await assertGroupExists(groupId);
  if (group.isDirect) {
    throw badRequest('Cannot add members to a direct message conversation');
  }
  if (isMemberOfGroup(group, targetUserId)) {
    throw conflict('User already a member of this group');
  }

  const updatedGroup = await addMemberToGroupRepo(groupId, targetUserId);
  if (updatedGroup?.$alreadyMember) {
    throw conflict('User already a member of this group');
  }
  const addedMember = updatedGroup.members.find(
    (m) => toIdString(m) === toIdString(targetUserId)
  );
  const resolvedUsername =
    addedMember?.username || targetUsername || 'a user';

  const notification = await createNotificationRepo({
    sender: actor._id,
    content: `${actor.username} added @${resolvedUsername} to the channel`,
    group: groupId,
  });

  if (io) {
    const room = toIdString(groupId);
    const targetRoom = `user_${toIdString(targetUserId)}`;
    io.in(targetRoom).socketsJoin(room);
    io.to(room).emit('group_member_added', {
      groupId: room,
      userId: toIdString(targetUserId),
      group: updatedGroup,
      member: addedMember,
    });
    io.to(room).emit('new_message', notification);
    io.to(targetRoom).emit('added_to_group', updatedGroup);
    io.to(targetRoom).emit('push_notification', {
      type: 'added_to_group',
      title: `Added to #${updatedGroup.name}`,
      body: `${actor.displayName || actor.username} added you to #${updatedGroup.name}`,
      groupId: room,
      groupName: updatedGroup.name,
      isDirect: false,
      senderId: toIdString(actor._id),
      senderName: actor.displayName || actor.username,
      url: `/channels/${room}`,
      createdAt: new Date().toISOString(),
    });
  }

  const targetIdStr = toIdString(targetUserId);
  if (!io || getUserSockets(targetIdStr).size === 0) {
    void sendPushNotificationToUsers([targetIdStr], {
      type: 'added_to_group',
      title: `Added to #${updatedGroup.name}`,
      body: `${actor.displayName || actor.username} added you to #${updatedGroup.name}`,
      groupId: toIdString(groupId),
      groupName: updatedGroup.name,
      isDirect: false,
      url: `/channels/${toIdString(groupId)}`,
    });
  }

  return { group: updatedGroup, member: addedMember, notification };
};

export const leaveGroupService = async ({ groupId, user, socket, io }) => {
  const group = await assertGroupExists(groupId);
  const userId = toIdString(user._id);

  if (!isMemberOfGroup(group, userId)) {
    throw badRequest('Not a member of this group');
  }

  const updatedGroup = await removeMemberFromGroupRepo(groupId, userId);
  const room = toIdString(groupId);

  if (socket) {
    socket.leave(room);
  }

  const notification = await createNotificationRepo({
    sender: user._id,
    content: `${user.username} left the channel`,
    group: groupId,
  });

  if (io) {
    io.to(room).emit('group_member_left', {
      groupId: room,
      userId,
      group: updatedGroup,
    });
    io.to(room).emit('new_message', notification);
    io.to(`user_${userId}`).emit('removed_from_group', { groupId: room });
  } else if (socket) {
    socket.to(room).emit('new_message', notification);
  }

  return { group: updatedGroup, notification };
};

export const removeMemberByAdminService = async ({
  groupId,
  userIdToRemove,
  adminUser,
  io,
}) => {
  const group = await assertGroupExists(groupId);
  const adminId = toIdString(adminUser._id);

  if (!isAdminOfGroup(group, adminId)) {
    throw forbidden('Not group admin');
  }

  if (!isMemberOfGroup(group, userIdToRemove)) {
    throw badRequest('User not a member');
  }

  await removeMemberFromGroupRepo(groupId, userIdToRemove);
  const room = toIdString(groupId);

  if (io) {
    const sockets = getUserSockets(userIdToRemove);
    for (const sId of sockets) {
      const targetSocket = io.sockets.sockets.get(sId);
      if (targetSocket) {
        targetSocket.leave(room);
        targetSocket.emit('removed_from_group', {
          groupId: room,
          by: adminId,
        });
      }
    }
    io.to(room).emit('member_removed', {
      userId: toIdString(userIdToRemove),
      by: adminId,
    });
  }
};

export const deleteGroupService = async ({ groupId, io }) => {
  const group = await deleteGroupByIdRepo(groupId);
  if (!group) {
    throw notFound('Group not found');
  }

  await deleteMessagesByGroupRepo(groupId);

  if (io) {
    io.to(toIdString(groupId)).emit('group_deleted', {
      groupId: toIdString(groupId),
    });
  }

  return group;
};

export const broadcastUserOfflineService = async (userId, io) => {
  const groups = await findGroupIdsByMember(userId);
  for (const g of groups) {
    io.to(toIdString(g._id)).emit('user_offline', {
      userId: toIdString(userId),
    });
  }
};

export const Creategroup = async (req, res, next) => {
  try {
    const { name, description = '' } = req.validated?.body || req.body;
    const createdGroup = await createGroupService({
      name,
      description,
      userId: req.user._id,
      io: req.io,
    });
    return res.status(201).json(createdGroup);
  } catch (err) {
    if (next) return next(err);
    return res.status(err.statusCode || 400).json({ message: err.message });
  }
};

import {
  createMessageRepo,
  createNotificationRepo,
  findMessagesByGroupRepo,
  markGroupMessagesDeliveredRepo,
  markMessagesAsReadRepo,
} from '../repositories/chat.repository.js';
import { findGroupsByMember } from '../repositories/group.repository.js';
import {
  assertGroupExists,
  isMemberOfGroup,
  toIdString,
} from './group.service.js';
import {
  buildInitialDeliveries,
  getOnlineMembersForGroup,
} from './presence.service.js';
import { badRequest, forbidden } from '../utils/error.util.js';

export const getGroupMessagesService = async ({
  groupId,
  userId,
  limit = 50,
  before,
}) => {
  const group = await assertGroupExists(groupId);
  if (!isMemberOfGroup(group, userId)) {
    throw forbidden('Not authorized to view messages in this group');
  }

  return findMessagesByGroupRepo(groupId, { limit, before });
};

export const sendMessageService = async ({
  groupId,
  content,
  senderId,
  io,
}) => {
  if (!content || !groupId) {
    throw badRequest('Content and group_id are required');
  }

  const group = await assertGroupExists(groupId);
  if (!isMemberOfGroup(group, senderId)) {
    throw forbidden('Not authorized to send messages in this group');
  }

  const deliveries = buildInitialDeliveries(group.members, senderId, groupId);

  const populatedMessage = await createMessageRepo({
    sender: senderId,
    content,
    group: groupId,
    type: 'message',
    deliveries,
  });

  if (io) {
    const room = toIdString(groupId);
    io.to(room).emit('new_message', populatedMessage);
    io.to(room).emit('newMessage', populatedMessage);
  }

  return populatedMessage;
};

export const createGroupCreatedNotificationService = ({
  groupId,
  user,
}) =>
  createNotificationRepo({
    sender: user._id,
    content: `${user.username} created the group.`,
    group: groupId,
  });

export const markMessagesAsReadService = async ({
  groupId,
  unreadIds,
  userId,
  io,
}) => {
  const updatedMessages = await markMessagesAsReadRepo({
    groupId,
    unreadIds,
    userId,
  });

  if (io && groupId) {
    io.to(toIdString(groupId)).emit('updateMessage', updatedMessages);
  }

  return updatedMessages;
};

export const syncUserGroupsOnConnectService = async ({ user, socket, io }) => {
  const userId = toIdString(user._id);
  const groups = await findGroupsByMember(userId);

  await Promise.all(
    groups.map(async (group) => {
      const room = toIdString(group._id);
      socket.join(room);

      const onlineList = getOnlineMembersForGroup(group.members);
      const updatedMessages = await markGroupMessagesDeliveredRepo(
        group._id,
        userId
      );

      io.to(room).emit('updateMessage', updatedMessages);
      socket.emit('initialonline', {
        groupId: room,
        users: onlineList,
      });
      io.to(room).emit('online_member', {
        groupId: room,
        username: user.username,
        userId,
      });
    })
  );
};


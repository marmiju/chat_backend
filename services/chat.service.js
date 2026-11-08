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
  getUserSockets,
} from './presence.service.js';
import { sendPushNotificationToUsers } from './push.service.js';
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

  const room = toIdString(groupId);
  const senderIdStr = toIdString(senderId);
  const recipientIds = (group.members || [])
    .map((m) => toIdString(m))
    .filter((id) => id && id !== senderIdStr);

  const senderObj =
    typeof populatedMessage.sender === 'object' && populatedMessage.sender
      ? populatedMessage.sender
      : null;
  const senderName =
    senderObj?.displayName || senderObj?.username || 'Someone';
  const isDirect = Boolean(
    group.isDirect || String(group.name || '').startsWith('dm-')
  );
  const notificationTitle = isDirect
    ? senderName
    : `${senderName} in #${group.name}`;

  const notificationPayload = {
    type: 'message',
    title: notificationTitle,
    body: content,
    groupId: room,
    groupName: group.name,
    isDirect,
    senderId: senderIdStr,
    senderName,
    senderAvatar: senderObj?.avatar || '',
    messageId: toIdString(populatedMessage._id),
    url: `/channels/${room}`,
    createdAt: populatedMessage.createdAt || new Date().toISOString(),
  };

  if (io) {
    io.to(room).emit('new_message', populatedMessage);
    io.to(room).emit('newMessage', populatedMessage);

    for (const memberId of recipientIds) {
      io.to(`user_${memberId}`).emit('push_notification', notificationPayload);
    }
  }

  // Only send Web Push to recipients who do not have an active Socket.IO connection
  // so online users don't receive both a Socket notification and a Service Worker Web Push.
  const offlineRecipientIds = io
    ? recipientIds.filter((memberId) => getUserSockets(memberId).size === 0)
    : recipientIds;

  if (offlineRecipientIds.length > 0) {
    void sendPushNotificationToUsers(offlineRecipientIds, notificationPayload);
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

  if (io && groupId && Array.isArray(updatedMessages) && updatedMessages.length > 0) {
    const room = toIdString(groupId);
    io.to(room).emit('updateMessage', updatedMessages);

    // Also emit directly to each message sender's personal room to guarantee delivery
    const senderIds = new Set(
      updatedMessages
        .map((m) => toIdString(m.sender?._id || m.sender))
        .filter(Boolean)
    );
    for (const senderId of senderIds) {
      io.to(`user_${senderId}`).emit('updateMessage', updatedMessages);
    }
  }

  return updatedMessages;
};

export const syncUserGroupsOnConnectService = async ({ user, socket, io }) => {
  const userId = toIdString(user._id);
  const groups = await findGroupsByMember(userId);

  // Join all group rooms first so no room broadcasts are missed
  for (const group of groups) {
    socket.join(toIdString(group._id));
  }

  await Promise.all(
    groups.map(async (group) => {
      const room = toIdString(group._id);

      const onlineList = getOnlineMembersForGroup(group.members);
      const updatedMessages = await markGroupMessagesDeliveredRepo(
        group._id,
        userId
      );

      if (Array.isArray(updatedMessages) && updatedMessages.length > 0) {
        io.to(room).emit('updateMessage', updatedMessages);
      }
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


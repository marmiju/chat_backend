import { authenticateToken } from './middlewares/AuthMidlewares.js';
import {
  registerSocket,
  unregisterSocket,
  setActiveGroup,
  clearActiveGroup,
} from './services/presence.service.js';
import {
  addMemberToGroupService,
  leaveGroupService,
  removeMemberByAdminService,
  broadcastUserOfflineService,
  startDirectMessageService,
  toIdString,
} from './services/group.service.js';
import {
  sendMessageService,
  createGroupCreatedNotificationService,
  markMessagesAsReadService,
  syncUserGroupsOnConnectService,
} from './services/chat.service.js';
import { withSocketAck } from './utils/async.util.js';

const resolveSocketUser = async (handshake = {}) => {
  const token =
    handshake.auth?.token ||
    handshake.headers?.authorization?.split(' ')[1];

  if (token) {
    return authenticateToken(token);
  }

  const userPayload = handshake.auth?.user;
  if (!userPayload) {
    throw new Error('No user or token provided');
  }

  return typeof userPayload === 'string'
    ? JSON.parse(userPayload)
    : userPayload;
};

const createSocketHandlers = (io, socket, user) => {
  const userId = toIdString(user._id);

  return {
    onJoinGroupRoom: ({ groupId } = {}) => {
      if (groupId) {
        socket.join(toIdString(groupId));
      }
    },

    onCreateGroup: withSocketAck(async ({ groupId }) => {
      const room = toIdString(groupId);
      socket.join(room);
      await createGroupCreatedNotificationService({ groupId: room, user });
      return { status: 'ok', message: 'Group created!' };
    }),

    onAddUserToGroup: withSocketAck(async ({ groupId, userId: targetUserId, username }) => {
      await addMemberToGroupService({
        groupId,
        targetUserId,
        actor: user,
        targetUsername: username,
        io,
      });
      return {
        status: 'success',
        message: 'User added to group successfully',
      };
    }),

    onLeaveGroup: withSocketAck(async ({ groupId }) => {
      await leaveGroupService({
        groupId,
        user,
        socket,
        io,
      });
      return {
        status: 'ok',
        message: 'Left group successfully',
      };
    }),

    onSendMessage: withSocketAck(async ({ groupId, content }) => {
      const message = await sendMessageService({
        groupId,
        content,
        senderId: user._id,
        io,
      });
      return { status: 'ok', messageId: message._id };
    }),

    onMarkAsRead: withSocketAck(async ({ groupId, unreadIds }) => {
      await markMessagesAsReadService({
        groupId,
        unreadIds,
        userId,
        io,
      });
    }),

    onTyping: ({ groupId, isTyping } = {}) => {
      if (!groupId) return;
      const room = toIdString(groupId);
      socket.to(room).emit('typing', {
        groupId: room,
        username: user.username,
        isTyping: Boolean(isTyping),
      });
    },

    onAdminRemoveMember: withSocketAck(async ({ groupId, userIdToRemove }) => {
      await removeMemberByAdminService({
        groupId,
        userIdToRemove,
        adminUser: user,
        io,
      });
      return { status: 'ok' };
    }),

    onStartDirectMessage: withSocketAck(async ({ targetUserId }) => {
      const group = await startDirectMessageService({
        actor: user,
        targetUserId,
        io,
      });
      return { status: 'ok', group };
    }),

    onActiveGroup: async ({ groupId } = {}) => {
      if (!groupId) return;
      const room = toIdString(groupId);
      setActiveGroup(socket.id, room);
      socket.join(room);
      try {
        await markMessagesAsReadService({
          groupId: room,
          userId,
          io,
        });
      } catch (err) {
        console.error('Error marking messages read on active_group:', err.message);
      }
    },

    onInactiveGroup: () => clearActiveGroup(socket.id),

    onDisconnect: async () => {
      try {
        const { userId: disconnectedUserId, wentOffline } = unregisterSocket(socket.id);
        if (wentOffline && disconnectedUserId) {
          await broadcastUserOfflineService(disconnectedUserId, io);
        }
      } catch (err) {
        console.error('Error handling socket disconnect:', err.message);
      }
    },
  };
};

export const SocketIO = (io) => {
  io.use(async (socket, next) => {
    try {
      socket.data.user = await resolveSocketUser(socket.handshake);
      next();
    } catch (err) {
      next(new Error(err.message || 'Authentication failed'));
    }
  });

  io.on('connection', async (socket) => {
    const user = socket.data.user;
    if (!user?._id) return socket.disconnect(true);

    const userId = toIdString(user._id);
    registerSocket(socket.id, userId);
    socket.join(`user_${userId}`);

    // Register event handlers immediately before awaiting async DB operations
    // so initial client emissions (active_group, mark_as_read, etc.) are never dropped.
    const handlers = createSocketHandlers(io, socket, user);

    socket.on('join_group_room', handlers.onJoinGroupRoom);
    socket.on('create_group', handlers.onCreateGroup);
    socket.on('add-user-to-group', handlers.onAddUserToGroup);
    socket.on('leave', handlers.onLeaveGroup);
    socket.on('send_message', handlers.onSendMessage);
    socket.on('mark_as_read', handlers.onMarkAsRead);
    socket.on('typing', handlers.onTyping);
    socket.on('admin_remove_member', handlers.onAdminRemoveMember);
    socket.on('start_direct_message', handlers.onStartDirectMessage);
    socket.on('active_group', handlers.onActiveGroup);
    socket.on('inactive_group', handlers.onInactiveGroup);
    socket.on('disconnect', handlers.onDisconnect);

    try {
      await syncUserGroupsOnConnectService({ user, socket, io });
    } catch (err) {
      console.error('Failed to sync user groups on connect:', err.message);
    }
  });
};

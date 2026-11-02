const socketToUser = new Map();
const onlineUsers = new Map();
const activeGroupBySocket = new Map();

export const registerSocket = (socketId, userId) => {
  const normalizedUserId = userId.toString();
  socketToUser.set(socketId, normalizedUserId);

  const userSockets = onlineUsers.get(normalizedUserId) || new Set();
  userSockets.add(socketId);
  onlineUsers.set(normalizedUserId, userSockets);
};

export const unregisterSocket = (socketId) => {
  const userId = socketToUser.get(socketId);
  socketToUser.delete(socketId);
  activeGroupBySocket.delete(socketId);

  if (!userId) {
    return { userId: null, wentOffline: false };
  }

  const userSockets = onlineUsers.get(userId);
  if (!userSockets) {
    return { userId, wentOffline: false };
  }

  userSockets.delete(socketId);
  if (userSockets.size === 0) {
    onlineUsers.delete(userId);
    return { userId, wentOffline: true };
  }

  onlineUsers.set(userId, userSockets);
  return { userId, wentOffline: false };
};

export const setActiveGroup = (socketId, groupId) => {
  if (groupId) {
    activeGroupBySocket.set(socketId, groupId.toString());
  }
};

export const clearActiveGroup = (socketId) => {
  activeGroupBySocket.delete(socketId);
};

export const getUserSockets = (userId) =>
  onlineUsers.get(userId.toString()) || new Set();

export const isUserOnline = (userId) =>
  getUserSockets(userId).size > 0;

export const getMemberDeliveryStatus = (memberId, senderId, groupId) => {
  const normalizedMemberId = memberId.toString();
  const normalizedSenderId = senderId.toString();
  const normalizedGroupId = groupId.toString();

  if (normalizedMemberId === normalizedSenderId) {
    return 'read';
  }

  const sockets = getUserSockets(normalizedMemberId);
  if (sockets.size === 0) {
    return 'sent';
  }

  const isViewingGroup = Array.from(sockets).some(
    (sId) => activeGroupBySocket.get(sId) === normalizedGroupId
  );

  return isViewingGroup ? 'read' : 'delivered';
};

export const buildInitialDeliveries = (members = [], senderId, groupId) => {
  const now = new Date();
  return members.map((member) => {
    const memberId = member._id ? member._id : member;
    return {
      user: memberId,
      status: getMemberDeliveryStatus(memberId, senderId, groupId),
      at: now,
    };
  });
};

export const getOnlineMembersForGroup = (members = []) =>
  members
    .filter((member) => isUserOnline(member._id || member))
    .map((member) => ({
      username: member.username,
      userId: (member._id || member).toString(),
    }));


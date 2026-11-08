import { Message } from '../model/ChatModel.js';

const USER_PUBLIC_FIELDS =
  'username email displayName avatar bio title statusText phone';

const withPopulatedMessage = (query) =>
  query
    .populate('sender', USER_PUBLIC_FIELDS)
    .populate('group', 'name')
    .populate('deliveries.user', 'username displayName avatar');

export const createMessageRepo = async ({
  sender,
  content,
  group,
  type = 'message',
  deliveries = [],
}) => {
  const message = await Message.create({
    sender,
    content,
    group,
    type,
    deliveries,
  });
  return withPopulatedMessage(Message.findById(message._id));
};

export const createNotificationRepo = ({ sender, content, group }) =>
  createMessageRepo({
    sender,
    content,
    group,
    type: 'notification',
  });

export const findMessagesByGroupRepo = (groupId, { limit = 50, before } = {}) => {
  const safeLimit = Math.min(Math.max(Number(limit) || 50, 1), 100);
  const filter = { group: groupId };
  if (before) {
    filter._id = { $lt: before };
  }
  return withPopulatedMessage(
    Message.find(filter)
      .sort({ createdAt: -1 })
      .limit(safeLimit)
  );
};

export const markGroupMessagesDeliveredRepo = async (groupId, userId) => {
  const result = await Message.updateMany(
    {
      group: groupId,
      sender: { $ne: userId },
      deliveries: { $elemMatch: { user: userId, status: 'sent' } },
    },
    {
      $set: {
        'deliveries.$.status': 'delivered',
        'deliveries.$.at': new Date(),
      },
    }
  );

  if (!result.modifiedCount) {
    return [];
  }

  return withPopulatedMessage(
    Message.find({
      group: groupId,
      'deliveries.user': userId,
    })
      .sort({ createdAt: -1 })
      .limit(50)
  );
};

export const markMessagesAsReadRepo = async ({ groupId, unreadIds, userId }) => {
  const now = new Date();
  const baseFilter = {
    group: groupId,
    sender: { $ne: userId },
  };
  if (Array.isArray(unreadIds) && unreadIds.length > 0) {
    baseFilter._id = { $in: unreadIds };
  }

  // Update existing delivery entries for this user to 'read'
  const updateExisting = await Message.updateMany(
    {
      ...baseFilter,
      deliveries: { $elemMatch: { user: userId, status: { $ne: 'read' } } },
    },
    {
      $set: {
        'deliveries.$.status': 'read',
        'deliveries.$.at': now,
      },
    }
  );

  // Also add 'read' delivery entry if the user wasn't in deliveries yet
  const updateMissing = await Message.updateMany(
    {
      ...baseFilter,
      type: 'message',
      'deliveries.user': { $ne: userId },
    },
    {
      $push: {
        deliveries: {
          user: userId,
          status: 'read',
          at: now,
        },
      },
    }
  );

  const totalModified =
    (updateExisting.modifiedCount || 0) + (updateMissing.modifiedCount || 0);

  if (totalModified === 0 && (!Array.isArray(unreadIds) || unreadIds.length === 0)) {
    return [];
  }

  return withPopulatedMessage(
    Message.find({
      group: groupId,
      ...(Array.isArray(unreadIds) && unreadIds.length > 0
        ? { _id: { $in: unreadIds } }
        : { deliveries: { $elemMatch: { user: userId, status: 'read' } } }),
    })
      .sort({ createdAt: -1 })
      .limit(100)
  );
};

export const deleteMessagesByGroupRepo = (groupId) =>
  Message.deleteMany({ group: groupId });


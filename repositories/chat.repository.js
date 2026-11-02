import { Message } from '../model/ChatModel.js';

const withPopulatedMessage = (query) =>
  query
    .populate('sender', 'username email')
    .populate('group', 'name')
    .populate('deliveries.user', 'username');

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
  await Message.updateMany(
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
  if (Array.isArray(unreadIds) && unreadIds.length > 0) {
    await Message.updateMany(
      {
        _id: { $in: unreadIds },
        deliveries: { $elemMatch: { user: userId, status: { $ne: 'read' } } },
      },
      {
        $set: {
          'deliveries.$.status': 'read',
          'deliveries.$.at': new Date(),
        },
      }
    );
  }

  return withPopulatedMessage(
    Message.find({
      group: groupId,
      deliveries: { $elemMatch: { user: userId, status: 'read' } },
    })
      .sort({ createdAt: -1 })
      .limit(50)
  );
};

export const deleteMessagesByGroupRepo = (groupId) =>
  Message.deleteMany({ group: groupId });


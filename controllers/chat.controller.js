import {
  getGroupMessagesService,
  sendMessageService,
} from '../services/chat.service.js';
import { asyncHandler } from '../utils/async.util.js';

export const getGroupMessages = asyncHandler(async (req, res) => {
  const { groupId } = req.params;
  const { limit, before } = req.query;

  const messages = await getGroupMessagesService({
    groupId,
    userId: req.user._id,
    limit,
    before,
  });

  return res.status(200).json(messages);
});

export const sendMessage = asyncHandler(async (req, res) => {
  const { content, group_id, groupId } = req.body;
  const targetGroupId = group_id || groupId;

  const populatedMessage = await sendMessageService({
    groupId: targetGroupId,
    content,
    senderId: req.user._id,
    io: req.io,
  });

  return res.status(201).json(populatedMessage);
});


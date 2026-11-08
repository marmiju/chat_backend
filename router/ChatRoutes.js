import express from 'express';
import { protect } from '../middlewares/AuthMidlewares.js';
import {
  getGroupMessages,
  sendMessage,
  markGroupMessagesRead,
} from '../controllers/chat.controller.js';

export const ChatRouter = express.Router();

ChatRouter.get('/:groupId', protect, getGroupMessages);
ChatRouter.post('/:groupId/read', protect, markGroupMessagesRead);
ChatRouter.post('/', protect, sendMessage);

import express from 'express';
import { protect } from '../middlewares/AuthMidlewares.js';
import {
  getGroupMessages,
  sendMessage,
} from '../controllers/chat.controller.js';

export const ChatRouter = express.Router();

ChatRouter.get('/:groupId', protect, getGroupMessages);
ChatRouter.post('/', protect, sendMessage);

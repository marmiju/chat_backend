import express from 'express';
import { isAdmin, protect } from '../middlewares/AuthMidlewares.js';
import { validate } from '../middlewares/validate.midleware.js';
import {
  createGroupSchema,
  joinAtgroupSchema,
} from '../validators/group.validator.js';
import {
  createGroup,
  startDirectMessage,
  getUserGroups,
  getGroupById,
  joinGroup,
  leaveGroup,
  deleteGroup,
} from '../controllers/group.controller.js';

export const GroupRouter = express.Router();

// Create & list groups
GroupRouter.post('/', protect, validate(createGroupSchema), createGroup);
GroupRouter.get('/', protect, getUserGroups);

// Direct Message (1-to-1 person-to-person conversation)
GroupRouter.post('/dm/:targetUserId', protect, startDirectMessage);
GroupRouter.post('/dm', protect, startDirectMessage);

// Join group routes (supports optional target userId)
GroupRouter.post('/:groupId/join/:userId', protect, validate(joinAtgroupSchema), joinGroup);
GroupRouter.get('/:groupId/join/:userId', protect, validate(joinAtgroupSchema), joinGroup);
GroupRouter.post('/:groupId/join', protect, joinGroup);

// Leave a group
GroupRouter.post(['/:group_id/leave', '/:groupId/leave'], protect, leaveGroup);

// Delete a group (admin only)
GroupRouter.delete(['/:group_id/remove', '/:group_id'], protect, isAdmin, deleteGroup);

// Get single group by ID
GroupRouter.get('/:groupId', protect, getGroupById);

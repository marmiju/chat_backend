import express from 'express'
import { Group } from '../model/GroupModel.js';
import { isAdmin, protect } from '../middlewares/AuthMidlewares.js';
import { validate } from '../middlewares/validate.midleware.js';
import { createGroupSchema, joinAtgroupSchema } from '../validators/group.validator.js';
import { Creategroup } from '../services/group.service.js';

export const GroupRouter = express.Router()

GroupRouter.post('/', protect, validate(createGroupSchema), Creategroup )

GroupRouter.get('/', protect, async (req, res) => {
    try {
        const groups = await Group.find({
            members: req.user._id
        }).populate('admin', 'username email').populate('members', 'username email')
        res.status(200).json(groups)
    } catch (err) {
        res.status(400).json({ message: err.message })
    }
})

GroupRouter.get('/:groupId/join/:userId', protect, validate(joinAtgroupSchema), async (req, res) => {
    try {
        const group = await Group.findById(req.validated.params.groupId)
        if (!group) {
            return res.status(404).json({ message: 'group Not Found' })
        }
        if (group.members.filter(m => m.equals(req.validated.params.userId))) {
            return res.status(409).json({ message: 'User already a member of this group' });
        }
        group.members.push(req.user._id)
        await group.save()
        console.log('joinded')
        return res.status(201).json({ message: 'user added in group', group })
    } catch (err) {
        console.log(err.message)
    }
})
GroupRouter.post('/:group_id/leave', protect, async (req, res) => {
    try {
        const group = await Group.findById(req.params.group_id)
        if (!group) {
            return res.status(404).json({ message: 'group Not Found' })
        }
        if (!group.members.includes(req.user._id)) {
            return res.status(400).json({ message: 'not a member of this group' })
        }
        group.members.pull(req.user._id)
        await group.save()
        res.status(200).json({ message: 'left!' })
    } catch (err) {
        return res.status(400).json({ message: err.message })
    }
})

// remove groups
GroupRouter.delete('/:group_id/remove', protect, isAdmin, async (req, res) => {
    try {
        const group = await Group.findByIdAndDelete(req.params.group_id);
        console.log('deleted group:', group);
        res.status(200).json({
            message: 'Group deleted successfully',
            group
        });
    } catch (err) {
        console.error('error deleting group:', err);
        res.status(500).json({ message: 'Internal server error' });
    }
})
GroupRouter.get('/:groupId', protect, async (req, res) => {
    try {
        const group = await Group.findById(req.params.group_id).populate('admin', 'username email').populate('members', 'username email')
        if (!group) {
            return res.status(404).json({ message: 'group Not Found' })
        }
        res.status(200).json(group)
    } catch (err) {
        res.status(400).json({ message: err.message })
    }
})
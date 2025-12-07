import express from 'express'
import { Group } from '../model/GroupModel.js';
import { isAdmin, protect } from '../middlewares/AuthMidlewares.js';

export const GroupRouter = express.Router()

GroupRouter.post('/', protect, async (req, res) => {
    try {
        const { name, description } = req.body;
        const group = await Group.create({
            name,
            description,
            admin: req.user._id,
            members: [req.user._id]

        })
        const polulatedGroup = await Group.findById(group._id)
            .populate('admin', 'username email')
            .populate('members', 'username email');
        res.status(201).json(polulatedGroup)

    } catch (err) {
        console.log(err)
        res.status(400).json({ message: err.message })
    }
})

GroupRouter.get('/', protect, async (req, res) => {
    console.log(req.user)
    try {
        const groups = await Group.find({
            members: req.user._id
        }).populate('admin', 'username email').populate('members', 'username email')
        res.status(200).json(groups)
    } catch (err) {
        res.status(400).json({ message: err.message })
    }
})

GroupRouter.post('/:group_id/join', protect, async (req, res) => {
    try {
        const group = await Group.findById(req.params.group_id)
        if (!group) {
            return res.status(404).json({ message: 'group Not Found' })
        }
        if (group.members.includes(req.user._id)) {
            return res.status(201).json({ message: 'already membered in this group' })
        }
        console.log('joinded')
        group.members.push(req.user._id)
        await group.save()
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

GroupRouter.post('/:group_id/remove', protect, isAdmin, async (req, res) => {
    try {
        const group = await Group.findById(req.params.group_id)
        if (!group) {
            return res.status(404).json({ message: 'group Not Found' })
        }
        if (group.admin.toString() !== req.user._id.toString()) {
            return res.status(401).json({ message: 'not authorized' })
        }
        const { userId } = req.body
        if (!group.members.includes(userId)) {
            return res.status(400).json({ message: 'user is not a member of this group' })
        }
        group.members.pull(userId)
        await group.save()
        res.status(200).json({ message: 'removed!' })
    } catch (err) {
        return res.status(400).json({ message: err.message })
    }
})

GroupRouter.get('/:group_id', protect, async (req, res) => {
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
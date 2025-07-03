import express from 'express'
import { Group } from '../model/GroupModel.js';
import { isAdmin, protect } from '../middlewares/AuthMidlewares.js';

export const GroupRouter = express.Router()

GroupRouter.post('/', protect, isAdmin, async (req, res) => {
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
    try {
        const groups = await Group.find().populate('admin', 'username email').populate('members', 'username email')
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
        res.status(200).json({message:'joined!'})
    } catch (err) {
        return res.status(400).json({ message: err.message })

    }
})
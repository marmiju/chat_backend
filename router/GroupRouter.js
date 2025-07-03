import express from 'express'
import { Group } from '../model/GroupModel.js';
import { isAdmin, protect } from '../middlewares/AuthMidlewares.js';

export const GroupRouter = express.Router()

GroupRouter.post('/', protect,isAdmin, async (req, res) => {
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
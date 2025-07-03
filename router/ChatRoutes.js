import express from 'express'
import { protect } from '../middlewares/AuthMidlewares.js'
import { Message } from '../model/ChatModel.js'

export const ChatRouter = express.Router()

ChatRouter.post('/', protect, async (req, res) => {

    try {
        const { content, group_id } = req.body
        if (content || group_id) {
            return res.status(400).json({ message: 'empty content and group_id' })
        }
        const message = await Message.create({
            sender: req.user._id,
            content,
            group: group_id
        })
        const populatedMessage = await Message.findById(message._id).populate('group', 'username email')
        res.json(populatedMessage)

    } catch (error) {
        res.status(404).json(error.message)

    }

})
import { CreateGroupRepo } from "../repositories/group.repository.js";



export const Creategroup = async (req, res) => {
    try {
        const { name, description } = req.body;
        const createdGroup = await CreateGroupRepo(name, description, req.user._id)
        return res.status(201).json(createdGroup)
    } catch (err) {
        console.log(err)
        res.status(400).json({ message: err.message })
    }
}
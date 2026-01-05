import { Group } from "../model/GroupModel.js";

// create group
export const CreateGroupRepo = async (name, description,userId) => {
    const group = await Group.create({
        name,
        description,
        admin: userId,
        members: [userId]
    })
    const polulatedGroup = await Group.findById(group._id)
        .populate('admin', 'username email')
        .populate('members', 'username email');

    return polulatedGroup
}
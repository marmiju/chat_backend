import { Group } from "../model/GroupModel"

export const createGroup = async ({name,description, user}) => {
    const exist = await Group.find({name:name})
    if (exist) return {message:'email already exist'}
    const group = await Group.create({
        name,
        description,
        admin: user._id,
        members: [user._id]

    })
}
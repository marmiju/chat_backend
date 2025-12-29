import jwt from 'jsonwebtoken'
import { User } from '../model/user.model.js';
import { Group } from '../model/GroupModel.js';

export const protect = async (req, res, next) => {
    console.log(req.headers)
    let token;

    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
        try {
            token = req.headers.authorization.split(" ")[1]
            const decoded = jwt.verify(token, process.env.JWT_SECRET)
            req.user = await User.findById(decoded.id).select('-password')
            next()
        } catch (err) {
            console.log("err text", err)
            res.status(401).json({ message: 'not authorized, Token Failed!' })
        }
    } else {
        console.log('no token found')
        res.status(401).json({ message: 'not authorized, Token unvalid!' })
    }
}

export const isAdmin = async (req, res, next) => {

    try {
        const { group_id } = req.params;
        console.log('groupId from params:', group_id);
        const group = await Group.findById(group_id);
       console.log('group from DB:', group);
        if (!group) {
            return res.status(404).json({ message: 'Group not found' });
        }
       
        if (req.user && group.admin.toString() === req.user._id.toString()) {
    
            next()
        } else {
            res.status(401).json({ message: 'not authorized!, only Admin' })
        }

    } catch (err) {
        res.status(401).json({ message: 'not authorized!, only Admin...' })
    }
}
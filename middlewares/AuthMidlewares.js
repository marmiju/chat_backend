import jwt from 'jsonwebtoken'
import { User } from '../model/UserModel.js';

export const protect = async (req, res, next) => {
    let token;
    if (req.headers.authorization && req.headers.authorization.startsWith('panda')) {
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
        res.status(401).json({ message: 'not authorized, Token unvalid!' })
    }
}

export const isAdmin = (req, res, next) => {

    try {
        if (req.user && req.user.isAdmin) {
            next()
        } else {
            res.status(401).json({ message: 'not authorized!, only Admin' })
        }
    } catch (err) {
        res.status(401).json({ message: 'not authorized!, only Admin...' })
    }
}
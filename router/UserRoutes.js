import express from 'express'
import { User } from '../model/UserModel.js'
import jwt from 'jsonwebtoken'


//! configure 

export const userRouter = express.Router()

userRouter.post('/register', async (req, res) => {
    const { username, email, password } = req.body

    // ? check user isExsist
    try {
        const isExsist = await User.findOne({ email })
        if (isExsist) {
            return res.status(400).json({ message: 'email Already Exsist' })
        }
        const user = await User.create({
            username,
            email,
            password
        })
        if (user) {
            res.status(201).json({
                message: 'User Created Succesfully',
                _id: user._id,
                username: user.username,
                email: user.email

            })
        }

    } catch (error) {
        res.status(400).json({ message: error.message })
    }

})

userRouter.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;

        const user = await User.findOne({ email });
        if (user && (await user.matchPassword(password))) {
            res.json({
                _id: user._id,
                username: user.username,
                email: user.email,
                isAdmin: user.isAdmin,
                token:generate_token(user._id)
            })
        } else {
            res.status(401).json({ message: `email and password did't match` })
        }

    } catch (error) {
        res.status(400).json({message: error.message})

    }
})


const generate_token = (id) =>
  jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: '30d' });

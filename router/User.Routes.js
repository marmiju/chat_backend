import express from 'express'
import {
  registerUser,
  loginUser,
  searchUser
} from '../controllers/user.controller.js'
import { protect } from '../middlewares/AuthMidlewares.js'
const userRouter = express.Router()

userRouter.post('/register', registerUser)
userRouter.post('/login', loginUser)
userRouter.get('/search', protect, searchUser)

export default userRouter

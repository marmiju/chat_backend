import express from 'express'
import {
  registerUser,
  loginUser,
  searchUser
} from '../controllers/user.controller.js'
import { validate } from '../middlewares/validate.midleware.js'
import { loginSchema, registerSchema, searchSchema } from '../validators/user.validator.js'
// imported file or package 


// express server object
const userRouter = express.Router()

// routes
userRouter.post('/register', validate(registerSchema), registerUser)
userRouter.post('/login',validate(loginSchema), loginUser)
userRouter.get('/search', validate(searchSchema), searchUser)

export default userRouter

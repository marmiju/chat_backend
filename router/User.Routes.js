import express from 'express'
import {
  registerUser,
  loginUser,
  searchUser,
  getCurrentUserProfile,
  updateCurrentUserProfile,
  getVapidPublicKey,
  subscribePush,
  unsubscribePush,
} from '../controllers/user.controller.js'
import { protect } from '../middlewares/AuthMidlewares.js'
import { validate } from '../middlewares/validate.midleware.js'
import {
  loginSchema,
  registerSchema,
  searchSchema,
  updateProfileSchema
} from '../validators/user.validator.js'
// imported file or package 


// express server object
const userRouter = express.Router()

// routes
userRouter.post('/register', validate(registerSchema), registerUser)
userRouter.post('/login', validate(loginSchema), loginUser)
userRouter.get('/search', validate(searchSchema), searchUser)
userRouter.get('/me', protect, getCurrentUserProfile)
userRouter.put('/profile', protect, validate(updateProfileSchema), updateCurrentUserProfile)
userRouter.patch('/profile', protect, validate(updateProfileSchema), updateCurrentUserProfile)
userRouter.get('/push/vapid-public-key', protect, getVapidPublicKey)
userRouter.post('/push/subscribe', protect, subscribePush)
userRouter.post('/push/unsubscribe', protect, unsubscribePush)

export default userRouter

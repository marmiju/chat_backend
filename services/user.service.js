import { findByEmail, createUser, findByUsername } from '../repositories/user.repository.js'
import { generateToken } from '../utils/jwt.util.js'

export const register = async ({ username, email, password }) => {
  const exists = await findByEmail(email)
  if (exists) throw new Error('Email already exists')

  const user = await createUser({ username, email, password })

  return {
    _id: user._id,
    username: user.username,
    email: user.email
  }
}

export const login = async ({ email, password }) => {
  const user = await findByEmail(email)
  if (!user || !(await user.matchPassword(password))) {
    throw new Error('Invalid email or password')
  }

  return {
    _id: user._id,
    username: user.username,
    email: user.email,
    token: generateToken(user._id)
  }
}

export const searchByUsername = async (username) => {
  const user = await findByUsername(username)
  if (!user) throw new Error('User not found')

  return {
    _id: user._id,
    username: user.username,
    email: user.email
  }
}

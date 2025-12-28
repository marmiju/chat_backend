import * as userService from '../services/user.service.js'

export const registerUser = async (req, res, next) => {
  try {
    const user = await userService.register(req.body)
    res.status(201).json(user)
  } catch (err) {
    next(err)
  }
}

export const loginUser = async (req, res, next) => {
  try {
    const data = await userService.login(req.body)
    res.json(data)
  } catch (err) {
    next(err)
  }
}

export const searchUser = async (req, res, next) => {
  try {
    const user = await userService.searchByUsername(req.query.username)
    res.json(user)
  } catch (err) {
    next(err)
  }
}

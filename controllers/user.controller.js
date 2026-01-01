import * as userService from '../services/user.service.js'

export const registerUser = async (req, res, next) => {
  try {
    const user = await userService.register(req.validated.body)
    res.status(201).json(user)
  } catch (err) {
    next(err)
  }
}

export const loginUser = async (req, res, next) => {
  try {
    const data = await userService.login(req.validated.body)
    res.json(data)
  } catch (err) {
    console.log(err)
    next(err)
  }
}

export const searchUser = async (req, res, next) => {
  const {username} = req.query
  console.log(username)
  try {
    const user = await userService.searchByUsername(username)
    res.json(user)
  } catch (err) {
    next(err)
  }
}

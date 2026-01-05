import {User} from '../model/user.model.js'

export const findByEmail = email => User.findOne({ email })
export const findByUsername = username => User.findOne({ username })
export const createUser = data => User.create(data)

//? Header Files
import express from 'express'
import cors from 'cors'
import mongoose from 'mongoose'
import { Server } from 'socket.io'
import { configDotenv } from 'dotenv'
import bcerypt from 'bcryptjs'

//? configure 
configDotenv()

const PORT = process.env.PORT || 3000
const app = express()



app.use(express.json())

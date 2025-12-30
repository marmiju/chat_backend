import express from 'express'

const healthroute = express.Router()

healthroute.get('/', (req, res) => {
  res.status(200).json({
    status: 'ok',
    uptime: process.uptime(),
    timestamp: new Date().toISOString()
  })
})

export default healthroute

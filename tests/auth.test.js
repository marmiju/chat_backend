import request from 'supertest'
import { server } from '../server'
import mongoose from 'mongoose'

describe('Auth API', () => {

  beforeAll(async () => {
    // Wait until DB is connected
    if (mongoose.connection.readyState === 0) {
      await mongoose.connect(process.env.MONGO_URI, {
        useNewUrlParser: true,
        useUnifiedTopology: true
      })
    }
  })

  afterAll(async () => {
    // Close server & DB connections
    await mongoose.connection.close()
    server.close()
  })

  it('should register a user', async () => {
    const res = await request(server)
      .post('/api/user/register')
      .send({
        username: 'testuser',
        email: 'test@test.com',
        password: '123456'
      })

    expect(res.statusCode).toBe(201)
  })

  it('should login user', async () => {
    const res = await request(server)
      .post('/api/user/login')
      .send({
        email: 'test@test.com',
        password: '123456'
      })

    expect(res.statusCode).toBe(200)
  })
})

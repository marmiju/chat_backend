import request from 'supertest'
import { server } from '../server'

describe('Auth API', () => {
  
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

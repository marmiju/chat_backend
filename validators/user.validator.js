import * as z from 'zod'
export const registerSchema = z.object({
  body: z.object({
    username: z.string().min(3),
    email: z.string().email(),
    password: z.string().min(6)
  })
})

export const loginSchema = z.object({
  body: z.object({
    email: z.string().email(),
    password: z.string().min(6)
  })
})

export const searchSchema = z.object({
  query: z.object({
    username: z.string().min(1)
  })
})

export const updateProfileSchema = z.object({
  body: z.object({
    username: z.string().trim().min(3).max(40).optional(),
    email: z.string().trim().email().optional(),
    displayName: z.string().trim().max(80).optional(),
    avatar: z.string().max(1500000).optional(),
    bio: z.string().trim().max(500).optional(),
    title: z.string().trim().max(80).optional(),
    statusText: z.string().trim().max(100).optional(),
    phone: z.string().trim().max(40).optional(),
    currentPassword: z.string().optional(),
    newPassword: z.string().min(6).optional(),
  })
})

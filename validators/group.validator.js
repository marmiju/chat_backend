import * as z from 'zod'

export const createGroupSchema = z.object({
    body: z.object({
        name: z.string().min(1, 'Group name is required'),
        description: z.string().optional()
    })
})

export const joinAtgroupSchema = z.object({
    params: z.object({
        groupId: z.string(),
        userId: z.string().optional()
    })
})


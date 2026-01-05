import * as z from 'zod'

export const createGroupSchema = z.object({
    body: z.object({
        name: z.string(),
        description: z.string()
    })
})

export const joinAtgroupSchema = z.object({
    params: z.object({
        groupId:z.string(),
        userId :z.string()
    })
})

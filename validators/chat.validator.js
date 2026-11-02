import * as z from 'zod';

export const getMessagesSchema = z.object({
  params: z.object({
    groupId: z.string().min(1, 'Group ID is required'),
  }),
  query: z
    .object({
      limit: z.string().optional(),
      before: z.string().optional(),
    })
    .optional(),
});

export const sendMessageSchema = z.object({
  body: z.object({
    content: z.string().min(1, 'Content is required').max(4000),
    group_id: z.string().optional(),
    groupId: z.string().optional(),
  }),
});


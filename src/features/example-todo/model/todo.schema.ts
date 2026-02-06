import { z } from 'zod'

export const todoStatusSchema = z.enum(['pending', 'in_progress', 'completed'])
export const todoPrioritySchema = z.enum(['low', 'medium', 'high'])

export const createTodoSchema = z.object({
  title: z
    .string()
    .min(3, { message: 'validation.minLength' })
    .max(100, { message: 'validation.maxLength' }),
  description: z.string().max(500, { message: 'validation.maxLength' }).optional().default(''),
  status: todoStatusSchema.optional().default('pending'),
  priority: todoPrioritySchema,
  dueDate: z
    .string()
    .refine((date) => new Date(date) > new Date(), { message: 'validation.futureDate' }),
})

export const updateTodoSchema = createTodoSchema.partial().extend({
  id: z.string(),
})

export type CreateTodoSchema = z.infer<typeof createTodoSchema>
export type UpdateTodoSchema = z.infer<typeof updateTodoSchema>

import { createServerFn } from '@tanstack/react-start'
import { getDb } from '@/shared/lib/db'
import { roles, skills, jobTitles, experienceLevels } from '@/shared/lib/db/schema'
import { asc } from 'drizzle-orm'

export const getRolesFn = createServerFn({ method: 'GET' }).handler(async () => {
  const db = getDb()
  return await db.select().from(roles).orderBy(asc(roles.name))
})

export const getSkillsFn = createServerFn({ method: 'GET' }).handler(async () => {
  const db = getDb()
  return await db.select().from(skills).orderBy(asc(skills.name))
})

export const getJobTitlesFn = createServerFn({ method: 'GET' }).handler(async () => {
  const db = getDb()
  return await db.select().from(jobTitles).orderBy(asc(jobTitles.name))
})

export const getExperienceLevelsFn = createServerFn({ method: 'GET' }).handler(async () => {
  const db = getDb()
  return await db.select().from(experienceLevels).orderBy(asc(experienceLevels.name))
})

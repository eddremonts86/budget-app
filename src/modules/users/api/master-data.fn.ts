import { createServerFn } from '@tanstack/react-start'
import { asc } from 'drizzle-orm'
import { loadDb } from '@/shared/lib/db/load'
import { roles, skills, jobTitles, experienceLevels } from '@/shared/lib/db/schema'

export const getRolesFn = createServerFn({ method: 'GET' }).handler(async () => {
  const db = await loadDb()
  return await db.select().from(roles).orderBy(asc(roles.name)).limit(500)
})

export const getSkillsFn = createServerFn({ method: 'GET' }).handler(async () => {
  const db = await loadDb()
  return await db.select().from(skills).orderBy(asc(skills.name)).limit(500)
})

export const getJobTitlesFn = createServerFn({ method: 'GET' }).handler(async () => {
  const db = await loadDb()
  return await db.select().from(jobTitles).orderBy(asc(jobTitles.name)).limit(500)
})

export const getExperienceLevelsFn = createServerFn({ method: 'GET' }).handler(async () => {
  const db = await loadDb()
  return await db.select().from(experienceLevels).orderBy(asc(experienceLevels.name)).limit(500)
})

import { createServerFn } from '@tanstack/react-start'
import { asc } from 'drizzle-orm'
import { roles, skills, jobTitles, experienceLevels } from '@/shared/lib/db/schema'

async function loadDb() {
  const { getDb } = await import('@/shared/lib/db')
  return getDb()
}

export const getRolesFn = createServerFn({ method: 'GET' }).handler(async () => {
  const db = await loadDb()
  return await db.select().from(roles).orderBy(asc(roles.name))
})

export const getSkillsFn = createServerFn({ method: 'GET' }).handler(async () => {
  const db = await loadDb()
  return await db.select().from(skills).orderBy(asc(skills.name))
})

export const getJobTitlesFn = createServerFn({ method: 'GET' }).handler(async () => {
  const db = await loadDb()
  return await db.select().from(jobTitles).orderBy(asc(jobTitles.name))
})

export const getExperienceLevelsFn = createServerFn({ method: 'GET' }).handler(async () => {
  const db = await loadDb()
  return await db.select().from(experienceLevels).orderBy(asc(experienceLevels.name))
})

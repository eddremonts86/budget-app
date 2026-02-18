import { describe, expect, it } from 'vitest'
import fs from 'fs'
import path from 'path'

const dbPath = path.resolve(process.cwd(), 'mocks/db.json')

describe('Migration Verification', () => {
  const db = JSON.parse(fs.readFileSync(dbPath, 'utf-8'))
  const todos = db.todos
  const projects = db.projects

  it('should have all todos assigned to a project', () => {
    const unassigned = todos.filter((t: any) => !t.projectId)
    expect(unassigned.length).toBe(0)
  })

  it('should distribute tasks evenly among projects', () => {
    const distribution: Record<string, number> = {}
    projects.forEach((p: any) => distribution[p.id] = 0)

    todos.forEach((t: any) => {
      distribution[t.projectId]++
    })

    const counts = Object.values(distribution)
    const min = Math.min(...counts)
    const max = Math.max(...counts)

    expect(max - min).toBeLessThanOrEqual(1)
  })

  it('should have renamed example tasks', () => {
    const exampleTasks = todos.filter((t: any) => 
      t.title.toLowerCase().includes('tarea de ejemplo')
    )
    expect(exampleTasks.length).toBe(0)
  })

  it('should have created 5 projects', () => {
    expect(projects.length).toBe(5)
  })
})

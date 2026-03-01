import { getDb } from './src/shared/lib/db/index.js';
import { projects } from './src/shared/lib/db/schema.js';

async function checkProjects() {
  try {
    const db = getDb();
    const result = await db.select().from(projects);
    console.log('Projects found:', result.length);
    if (result.length > 0) {
      console.log('First project sample:', JSON.stringify(result[0], null, 2));
    }
  } catch (error) {
    console.error('Error checking projects:', error);
  }
}

checkProjects();

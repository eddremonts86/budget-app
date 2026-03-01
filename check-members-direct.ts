
import postgres from 'postgres';
import dotenv from 'dotenv';

dotenv.config();

const DATABASE_URL = process.env.DATABASE_URL;

if (!DATABASE_URL) {
  console.error('DATABASE_URL is not set');
  process.exit(1);
}

const sql = postgres(DATABASE_URL);

async function checkMembers() {
  try {
    const members = await sql`SELECT * FROM project_members`;
    console.log('--- PROJECT MEMBERS ---');
    console.log(JSON.stringify(members, null, 2));
    
    const users = await sql`SELECT id, name FROM users`;
    console.log('--- USERS ---');
    console.log(JSON.stringify(users, null, 2));
    
  } catch (error) {
    console.error('Error checking members:', error);
  } finally {
    await sql.end();
  }
}

checkMembers();

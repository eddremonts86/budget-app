
import fs from 'fs';
import path from 'path';

console.log('CWD:', process.cwd());
const configPath = path.resolve(process.cwd(), 'src/server/data/ai-config-store.json');
console.log('Config Path:', configPath);

try {
  const content = fs.readFileSync(configPath, 'utf-8');
  console.log('File content length:', content.length);
  const json = JSON.parse(content);
  console.log('JSON parse success');
} catch (error) {
  console.error('Error:', error);
}

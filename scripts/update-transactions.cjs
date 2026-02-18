const fs = require('fs');
const path = require('path');

const dbPath = path.join(__dirname, '../mocks/db.json');
const db = JSON.parse(fs.readFileSync(dbPath, 'utf8'));

const users = db.users || [];
const projects = db.projects || [];

if (users.length === 0 || projects.length === 0) {
  console.error('No users or projects found in db.json');
  process.exit(1);
}

const transactions = [];
const statuses = ['Approved', 'Pending', 'Rejected'];
const customers = [
  { name: 'Acme Corp', email: 'contact@acme.com' },
  { name: 'Globex', email: 'info@globex.com' },
  { name: 'Soylent Corp', email: 'sales@soylent.com' },
  { name: 'Initech', email: 'support@initech.com' },
  { name: 'Umbrella Corp', email: 'services@umbrella.com' },
  { name: 'Stark Industries', email: 'tony@stark.com' },
  { name: 'Wayne Enterprises', email: 'bruce@wayne.com' },
  { name: 'Cyberdyne Systems', email: 'skynet@cyberdyne.com' },
  { name: 'Massive Dynamic', email: 'bell@massive.com' },
  { name: 'Hooli', email: 'gavin@hooli.com' }
];

for (let i = 1; i <= 100; i++) {
  const user = users[Math.floor(Math.random() * users.length)];
  const project = projects[Math.floor(Math.random() * projects.length)];
  const customer = customers[Math.floor(Math.random() * customers.length)];
  const status = statuses[Math.floor(Math.random() * statuses.length)];
  
  // Random date within last year
  const date = new Date(Date.now() - Math.floor(Math.random() * 31536000000)).toISOString().split('T')[0];
  
  // Random amount between 100 and 10000
  const amount = parseFloat((Math.random() * 9900 + 100).toFixed(2));

  transactions.push({
    id: i.toString(),
    customer: {
      name: customer.name,
      email: customer.email
    },
    status: status,
    date: date,
    amount: amount,
    userId: user.id,
    projectId: project.id
  });
}

// Check if recentTransactions or transactions exists
if (db.recentTransactions) {
    db.recentTransactions = transactions;
} else {
    db.transactions = transactions;
    // ensure endpoint consistency if needed, but usually json-server uses top level keys
}

// Write back
fs.writeFileSync(dbPath, JSON.stringify(db, null, 2));
console.log('Successfully generated 100 transactions linked to users and projects.');

// Quick MongoDB connection tester
// Usage:
// 1) Ensure your .env in backend/ contains DATABASE_URI (mongodb+srv://user:pass@...)
// 2) Run: node test-mongo-conn.js

require('dotenv').config();
const { MongoClient } = require('mongodb');

const uri = process.env.DATABASE_URI || process.env.DATABASE_URL || '<paste-your-connection-string-here>';

async function test() {
  if (!uri || uri.includes('<paste')) {
    console.error('No connection string found. Set DATABASE_URI in backend/.env or paste it in this file.');
    process.exit(1);
  }

  console.log('Testing connection to MongoDB...');
  try {
    const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true });
    await client.connect();
    console.log('Connected OK');
    await client.db().admin().ping();
    console.log('Ping OK');
    await client.close();
    process.exit(0);
  } catch (err) {
    console.error('Connect failed:');
    // Print a short, helpful error message
    if (err && err.message) {
      console.error(err.message);
    } else {
      console.error(err);
    }
    process.exit(2);
  }
}

test();

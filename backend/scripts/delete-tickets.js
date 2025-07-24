const { Client } = require('pg');
require('dotenv').config();

async function deleteAllTickets() {
  const client = new Client({
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    database: process.env.DB_NAME,
    user: process.env.DB_USER,
    password: process.env.DB_PASS,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
  });

  try {
    await client.connect();
    console.log('Connected to database');
    
    const result = await client.query('DELETE FROM tickets;');
    console.log(`Deleted ${result.rowCount} tickets`);
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await client.end();
  }
}

deleteAllTickets();
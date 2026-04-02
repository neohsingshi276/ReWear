require('dotenv').config();
const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

pool.connect((err, client, release) => {
  if (err) {
    console.error('Database connection failed:', err.message);
  } else {
    console.log('Supabase database connected successfully');
    release();
  }
});

// -------------------------------------------------------
// Compatibility wrapper — makes pg behave like mysql2:
//   1. Converts MySQL ? placeholders → PostgreSQL $1 $2 $3
//   2. For INSERT queries, appends RETURNING id so that
//      result.insertId works (used in server.js)
//   3. Returns [rows, fields] array just like mysql2
// -------------------------------------------------------
const db = {
  query: async (sql, params = []) => {
    // Convert ? placeholders to $1, $2, $3 ...
    let i = 0;
    let pgSql = sql.replace(/\?/g, () => `$${++i}`);

    // For INSERT statements add RETURNING id
    const isInsert = /^\s*INSERT/i.test(pgSql);
    if (isInsert && !/RETURNING/i.test(pgSql)) {
      pgSql = pgSql.replace(/;?\s*$/, ' RETURNING id');
    }

    const result = await pool.query(pgSql, params);

    // Build a mysql2-compatible result object for INSERT
    const rows = result.rows || [];
    if (isInsert && rows.length > 0) {
      rows.insertId = rows[0].id;
    }

    return [rows, result.fields];
  }
};

module.exports = db;

const {Pool} = require('pg');
const pool = new Pool( {
    connectionString: process.env.DATABASE_URL,
    ssl: {
        rejectUnauthorized: false
    }
});

const DATABASE_URL = 'postgresql-rigid-32621';
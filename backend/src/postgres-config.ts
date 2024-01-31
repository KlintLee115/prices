const Pool = require("pg").Pool
require('dotenv').config();

const pool = new Pool({
    user: "ksports_user",
    host: "dpg-cl796db0p3is7388jtpg-a.oregon-postgres.render.com",
    database: "ksports",
    password: process.env.DB_PASS,
    port: 5432,
    ssl: {
        rejectUnauthorized: false, // Add this line to accept self-signed certificates
    },
})

module.exports = { pool }
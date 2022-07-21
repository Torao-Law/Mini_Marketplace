const { Pool } = require('pg')

const dbPool = new Pool({
    user: 'postgres',
    database: 'myProject37',
    password: 'root980819',
    port: 5432,
})

module.exports = dbPool
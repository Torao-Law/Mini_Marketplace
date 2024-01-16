const mysql = require('mysql')

const dbPool = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    database: 'marketplace',
    password: null,
    port: 3306,
    connectTimeout: 10,
    multipleStatements: true
})

module.exports = dbPool
import mysql from 'mysql2/promise';

export const dbConfig = {
    host: process.env.MYSQL_HOST,
    user: process.env.MYSQL_USER,
    password: process.env.MYSQL_PASS,
    database: 'proj_phtrs',
    waitForConnections: true,
    connectionLimit: 100,
    queueLimit: 0
};

export const pool = mysql.createPool(dbConfig); 
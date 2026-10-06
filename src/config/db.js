require('dotenv').config();
const { Sequelize } = require('sequelize');

const DB_NAME = process.env.DB_NAME || 'db_farmacia';
const DB_USER = process.env.DB_USER || 'root';
const DB_PASSWORD = process.env.DB_PASSWORD || '';
const DB_HOST = process.env.DB_HOST || 'localhost';
const DB_PORT = Number(process.env.DB_PORT) || 3306;

// Si existe DATABASE_URL (Render + PostgreSQL) se usa la nube; si no, MySQL de XAMPP.
const usaNube = Boolean(process.env.DATABASE_URL);

let sequelize;
if (usaNube) {
  sequelize = new Sequelize(process.env.DATABASE_URL.split('?')[0], {
    dialect: 'postgres',
    logging: false,
    dialectOptions: { ssl: { require: true, rejectUnauthorized: false } },
  });
} else {
  sequelize = new Sequelize(DB_NAME, DB_USER, DB_PASSWORD, {
    host: DB_HOST,
    port: DB_PORT,
    dialect: 'mysql',
    logging: false,
  });
}

// Crea la base de datos (db_farmacia) usando Sequelize si todavia no existe.
async function crearBaseDeDatos() {
  if (usaNube) return; // en la nube la base ya viene creada
  if (!/^\w+$/.test(DB_NAME)) throw new Error('DB_NAME invalido');
  const conexion = new Sequelize({
    dialect: 'mysql',
    host: DB_HOST,
    port: DB_PORT,
    username: DB_USER,
    password: DB_PASSWORD,
    logging: false,
  });
  await conexion.query(
    `CREATE DATABASE IF NOT EXISTS \`${DB_NAME}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`
  );
  await conexion.close();
}

module.exports = { sequelize, crearBaseDeDatos, usaNube, DB_NAME };

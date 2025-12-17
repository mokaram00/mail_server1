import { Sequelize } from 'sequelize';
import dotenv from 'dotenv';

dotenv.config();

// Using SQLite for simplicity, but can be changed to MySQL or PostgreSQL
const sequelize = new Sequelize({
  dialect: 'sqlite',
  storage: './database.sqlite',
  logging: false // Set to console.log to see SQL queries
});

// Alternative MySQL configuration (uncomment if needed):
/*
const sequelize = new Sequelize(
  process.env.DB_NAME || 'mailserver',
  process.env.DB_USER || 'root',
  process.env.DB_PASSWORD || '',
  {
    host: process.env.DB_HOST || 'localhost',
    dialect: 'mysql',
    logging: false
  }
);
*/

export default sequelize;
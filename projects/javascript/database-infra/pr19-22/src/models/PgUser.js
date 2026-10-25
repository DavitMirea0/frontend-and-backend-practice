const { DataTypes } = require('sequelize');
const sequelize = require('../config/postgres');

const PgUser = sequelize.define(
  'User',
  {
    id:         { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    first_name: { type: DataTypes.STRING(100), allowNull: false },
    last_name:  { type: DataTypes.STRING(100), allowNull: false },
    age:        { type: DataTypes.INTEGER, allowNull: false },
    created_at: { type: DataTypes.BIGINT },
    updated_at: { type: DataTypes.BIGINT },
  },
  { tableName: 'users', timestamps: false }
);

PgUser.beforeCreate((u) => {
  const now = Math.floor(Date.now() / 1000);
  u.created_at = now;
  u.updated_at = now;
});

PgUser.beforeUpdate((u) => {
  u.updated_at = Math.floor(Date.now() / 1000);
});

module.exports = PgUser;

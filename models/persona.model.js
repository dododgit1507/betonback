const { DataTypes } = require('sequelize');
const sequelize = require('../config/db.config');

const Persona = sequelize.define('Persona', {
  Id_Persona: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  },
  Nombre: {
    type: DataTypes.STRING(50),
    allowNull: false,
  },
  Correo: {
    type: DataTypes.STRING(75),
    allowNull: false,
  },
  Telefono: {
    type: DataTypes.CHAR(10),
    allowNull: false,
  },
  Pais: {
    type: DataTypes.STRING(50),
    allowNull: false,
  },
});

module.exports = Persona;

const Persona = require('../models/persona.model');

// Obtener todas las personas
const getAllPersonas = async (req, res) => {
  try {
    const personas = await Persona.findAll();
    res.json(personas);
  } catch (error) {
    res.status(500).json({ message: 'Error al obtener personas', error });
  }
};

// Crear una nueva persona
const createPersona = async (req, res) => {
  try {
    const { Nombre, Correo, Telefono, Pais } = req.body;
    const nuevaPersona = await Persona.create({ Nombre, Correo, Telefono, Pais });
    res.status(201).json(nuevaPersona);
  } catch (error) {
    res.status(500).json({ message: 'Error al crear persona', error });
  }
};

module.exports = { getAllPersonas, createPersona };

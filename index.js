const express = require('express');
const morgan = require('morgan');
const cors = require('cors');
const queries = require('./queries');  // Importamos las funciones del archivo queries.js
const pool = require('./db');  // Importamos la configuración de la base de datos

const app = express();

// Middlewares
app.use(morgan('dev'));
app.use(cors());
app.use(express.json());

// GET Endpoints
app.get('/pedidos', async (req, res) => {
  try {
    const result = await queries.getPedidos();
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).send('Error al obtener los pedidos');
  }
});

app.get('/proyecto', async (req, res) => {
  try {
    const result = await queries.getProyectos();
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).send('Error al obtener los proyectos');
  }
});

app.get('/usuario', async (req, res) => {
  try {
    const result = await queries.getUsuarios();
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).send('Error al obtener los usuarios');
  }
});

app.get('/transporte', async (req, res) => {
  try {
    const result = await queries.getTransportes();
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).send('Error al obtener los transportes');
  }
});

app.get('/oficina_tecnica', async (req, res) => {
  try {
    const result = await queries.getOficinasTecnicas();
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).send('Error al obtener las oficinas técnicas');
  }
});

app.get('/producto', async (req, res) => {
  try {
    const result = await queries.getProductos();
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).send('Error al obtener los productos');
  }
});

// POST Endpoints
app.post('/registrar_cliente', async (req, res) => {
    const { nombre, correo, telefono, pais, rol, contraseña } = req.body;

    try {
        const personaResult = await pool.query(
            `INSERT INTO Persona (Nombre, Correo, Telefono, Pais) 
             VALUES ($1, $2, $3, $4) RETURNING Id_Persona`,
            [nombre, correo, telefono, pais]
        );

        const idPersona = personaResult.rows[0].id_persona;

        await pool.query(
            `INSERT INTO Usuario (Correo, Contraseña, Rol, Id_Persona) 
             VALUES ($1, $2, $3, $4)`,
            [correo, contraseña, rol, idPersona]
        );

        res.status(201).json({ message: 'Cliente registrado exitosamente' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error al registrar el cliente' });
    }
});



app.post('/registrar_proyecto', async (req, res) => {
  const { id_proyecto_cup, nombre, suf } = req.body;
  try {
    const result = await queries.registrarProyecto(id_proyecto_cup, nombre, suf);
    res.json(result);
  } catch (err) {
    console.error(err);
    res.status(500).send('Error al registrar proyecto');
  }
});

app.post('/registrar_pedido', async (req, res) => {
  const data = req.body;
  try {
    const result = await queries.registrarPedido(data);
    res.json(result);
  } catch (err) {
    console.error(err);
    res.status(500).send('Error al registrar pedido');
  }
});

app.post('/registrar_envio', async (req, res) => {
  const data = req.body;
  try {
    const result = await queries.registrarEnvio(data);
    res.json(result);
  } catch (err) {
    console.error(err);
    res.status(500).send('Error al registrar envío');
  }
});

// PUT Endpoint
app.put('/actualizar_pedido/:codigo_pedido', async (req, res) => {
  const { codigo_pedido } = req.params;
  const data = req.body;
  try {
    const result = await queries.actualizarPedido(codigo_pedido, data);
    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).send('Error al actualizar pedido');
  }
});

// Puerto
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Servidor corriendo en el puerto ${PORT}`);
});

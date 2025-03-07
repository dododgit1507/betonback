const express = require('express');
const morgan = require('morgan');
const cors = require('cors');
const queries = require('./queries');  // Importamos las funciones del archivo queries.js
const pool = require('./db');  // Importamos la configuración de la base de datos
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

const saltRounds = 10;

const app = express();

// Middlewares
app.use(morgan('dev'));
app.use(cors());
app.use(express.json());
// GET Endpoints

const authenticateJWT = (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1]; // Esperamos el token en el header Authorization: Bearer <token>

  if (!token) {
    return res.status(403).json({ message: 'Token no proporcionado' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded; // Almacenar la información del usuario en req.user
    next(); // Pasar al siguiente middleware o ruta
  } catch (err) {
    return res.status(401).json({ message: 'Token inválido o expirado' });
  }
};

// Ejemplo de una ruta protegida
app.get('/pedidos', authenticateJWT, async (req, res) => {
  try {
    const result = await queries.getPedidos(req.user.id_usuario);
    res.json(result);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Error al obtener los pedidos' });
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

app.get('/envio', async (req, res) => {
  try {
    const result = await queries.getEnvio();
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
      // Validar que los campos requeridos no estén vacíos
      if (!nombre || !correo || !telefono || !pais || !rol || !contraseña) {
          return res.status(400).json({ message: 'Todos los campos son obligatorios' });
      }

      // Verificar si el correo ya está registrado
      const correoExistente = await pool.query('SELECT * FROM usuario WHERE correo = $1', [correo]);

      if (correoExistente.rows.length > 0) {
          return res.status(400).json({ message: 'El correo ya está registrado' });
      }

      // Encriptar la contraseña
      const hashedPassword = await bcrypt.hash(contraseña, saltRounds);

      // Insertar en la tabla Persona
      const personaResult = await pool.query(
          `INSERT INTO persona (nombre, correo, telefono, pais) 
           VALUES ($1, $2, $3, $4) RETURNING id_persona`,
          [nombre, correo, telefono, pais]
      );

      const idPersona = personaResult.rows[0].id_persona;

      // Insertar en la tabla Usuario
      await pool.query(
          `INSERT INTO usuario (correo, contraseña, rol, id_persona) 
           VALUES ($1, $2, $3, $4)`,
          [correo, hashedPassword, rol, idPersona]
      );

      // Enviar respuesta con éxito
      res.status(201).json({ message: 'Cliente registrado exitosamente', idPersona });
  } catch (error) {
      console.error(error);
      res.status(500).json({ message: 'Error al registrar el cliente' });
  }
});

app.post('/login', async (req, res) => {
  const { correo, contraseña } = req.body;
  console.log('Correo:', { correo });
  console.log('Contraseña:', contraseña);

  try {
    const query = 'SELECT * FROM usuario WHERE correo = $1';
    const result = await pool.query(query, [correo]);

    if (result.rows.length === 0) {
      console.log('Usuario no encontrado');
      return res.status(400).json({ message: 'Usuario o contraseña incorrectos' });
    }

    const user = result.rows[0];
    console.log('Usuario encontrado:', user);

    const isPasswordValid = await bcrypt.compare(contraseña, user.contraseña);
    console.log('¿Contraseña válida?', isPasswordValid);

    if (!isPasswordValid) {
      return res.status(400).json({ message: 'Usuario o contraseña incorrectos' });
    }

    // Obtener el nombre de la persona a partir del id_persona
    const personaQuery = 'SELECT nombre FROM persona WHERE id_persona = $1';
    const personaResult = await pool.query(personaQuery, [user.id_persona]);

    if (personaResult.rows.length === 0) {
      console.log('Persona no encontrada');
      return res.status(400).json({ message: 'Usuario o contraseña incorrectos' });
    }

    const persona = personaResult.rows[0].nombre;

    const token = jwt.sign(
      { id_usuario: user.id_usuario, correo: user.correo, rol: user.rol },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || '1h' }
    );

    console.log('Token:', token);
    console.log('Id usuario:', user.id_usuario);
    console.log('Rol:', user.rol);
    console.log('Nombre:', persona);

    // Devolver el token, id_usuario, rol y nombre de usuario
    res.json({ 
      token, 
      id_usuario: user.id_usuario, 
      rol: user.rol, // Mandar el rol de la persona
      nombre: persona // Mandar el nombre de la persona
    });
  } catch (err) {
    console.error('Error en el servidor:', err);
    res.status(500).json({ message: 'Error en el servidor' });
  }
});

// Ruta para registrar una nueva oficina técnica
app.post('/registrar_oficina', async (req, res) => {
  const { especialidad, id_persona } = req.body; // Ahora recibimos también el id_persona

  if (!especialidad || !id_persona) {
    return res.status(400).send('Faltan datos requeridos');
  }

  try {
    const result = await queries.registrarOficina({ especialidad, id_persona }); // Pasar un objeto con ambos campos
    res.json(result);
  } catch (err) {
    console.error(err);
    res.status(500).send('Error al registrar la oficina');
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

app.post('/codigo', async (req, res) => {
  const { codigo, usuarioId } = req.body;

  // Log para ver qué datos están llegando desde el front
  console.log('Datos recibidos:', { codigo, usuarioId });

  try {
    // Log para saber si el query está siendo ejecutado
    console.log('Ejecutando query para insertar código...');

    // Aquí ejecutamos el query para insertar el código en la base de datos
    const result = await queries.insertarCodigo({ codigo, usuarioId });

    // Log para ver el resultado de la inserción
    console.log('Resultado del query:', result);

    res.json(result);  // Enviamos el resultado como respuesta
  } catch (err) {
    // Log para capturar cualquier error en la inserción
    console.error('Error al generar el código:', err);
    res.status(500).send('Error al generar el código');
  }
})

app.post('/verificar_codigo', async (req, res) => {
  const { codigo, usuarioId } = req.body;

  console.log('Datos recibidos:', { codigo, usuarioId });

  try {
    console.log('Ejecutando query para verificar el código...');

    const result = await queries.verificarCodigo({ codigo, usuarioId });

    if (result && result.rows && result.rows.length > 0) {
      console.log('Código encontrado:', result.rows[0]);

      // Eliminar el código después de validarlo
      await queries.eliminarCodigo({ codigo, usuarioId });

      res.json({ success: true, message: 'Código válido y eliminado' });
    } else {
      res.status(404).json({ success: false, message: 'Código inválido o no activo' });
    }
  } catch (err) {
    console.error('Error al verificar el código:', err);
    res.status(500).send('Error al verificar el código');
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

  // Validación de datos
  if (!codigo_pedido || Object.keys(data).length === 0) {
    return res.status(400).json({ error: 'Código de pedido y datos son requeridos' });
  }

  try {
    console.log(`Código del pedido recibido: ${codigo_pedido}`);
    console.log('Datos recibidos del frontend:', data); // Imprime el arreglo de datos que se recibe desde el frontend
    
    // Llamada a la función que actualiza el pedido
    const result = await queries.actualizarPedido(codigo_pedido, data);
    
    if (result.rowCount === 0) {
      return res.status(404).json({ error: 'Pedido no encontrado' });
    }

    // Enviar la respuesta con el pedido actualizado
    res.json({ message: 'Pedido actualizado correctamente', pedido: result.rows[0] });
  } catch (error) {
    console.error('Error al actualizar el pedido:', error);
    res.status(500).json({ error: 'Error interno del servidor al actualizar el pedido' });
  }
});
// Puerto
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Servidor corriendo en el puerto ${PORT}`);
});

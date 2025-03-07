const db = require('./db');
const pool = require('./db');

// Funciones para obtener datos
const getPedidos = async (userId) => {
  try {
    const result = await pool.query(`
      SELECT
        pr.nombre AS nombre_proyecto_cup,
        dp.codigo_pedido,
        prod.tipo AS nombre_producto,
        ofi.especialidad AS oficina_especialidad,
        per_ofi.nombre AS nombre_oficina,
        dp.metros_cuadrados AS m2,
        dp.metros_lineales AS ml,
        dp.kilogramos AS kg,
        dp.frisos AS frisos_ml,
        dp.chatas AS chatas_kg,
        dp.fecha,
        dp.hora,
        dp.nivel,
        dp.codigo_plano,
        dp.planta,
        per.nombre AS nombre_usuario,
        pr.id_proyecto_cup,
        pr.suf,
        t.nombre AS nombre_transporte
      FROM detalle_pedido dp
      JOIN proyecto pr ON dp.id_proyecto_cup = pr.id_proyecto_cup
      JOIN producto prod ON dp.id_producto = prod.id_producto
      JOIN usuario u ON dp.id_usuario = u.id_usuario  
      JOIN persona per ON u.id_persona = per.id_persona  
      JOIN transporte t ON dp.id_transporte = t.id_transporte
      JOIN oficina_tecnica ofi ON dp.id_oficina = ofi.id_oficina
      JOIN persona per_ofi ON ofi.id_persona = per_ofi.id_persona`);

    // Verifica si result y result.rows están correctamente definidos
    if (!result || !result.rows) {
      console.error('Error: result o result.rows no están definidos');
      return [];
    }

    // Si hay filas en result.rows, devolverlas
    if (result.rows.length > 0) {
      return result.rows;
    } else {
      console.log('No se encontraron pedidos para el usuario con ID:', userId);
      return []; // Devuelve un array vacío si no hay resultados
    }
  } catch (err) {
    console.error('Error al obtener los pedidos:', err);
    throw new Error('Error al obtener los pedidos'); // Propaga el error al controlador
  }
};



const getProyectos = async () => {
  return await db.query('SELECT * FROM proyecto');
};

const getUsuarios = async () => {
  return await db.query(`
    SELECT 
      usuario.id_usuario AS ID, 
      persona.nombre AS Nombre, 
      persona.telefono AS Telefono, 
      usuario.correo AS Correo, 
      usuario.rol AS Rol,
      persona.pais AS Pais
    FROM usuario
    INNER JOIN persona ON usuario.id_persona = persona.id_persona
  `);
};

const getEnvio = async () => {
  return await db.query('SELECT * FROM envio');
};

const getTransportes = async () => {
  return await db.query('SELECT * FROM transporte');
};

const getOficinasTecnicas = async () => {
  return await db.query(`
    SELECT 
      persona.id_persona as ID, 
      persona.nombre as Nombre, 
      oficina_tecnica.especialidad as Especialidad
    FROM persona
    INNER JOIN oficina_tecnica ON persona.id_persona = oficina_tecnica.id_persona
    `);
};

const getProductos = async () => {
  return await db.query('SELECT * FROM producto');
};

// Funciones para insertar datos

const registrarCliente = async (req, res) => {
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
};

// En tu archivo principal de rutas (app.js o server.js)


const getUserByEmail = async (email) => {
  try {
    const query = 'SELECT * FROM usuario WHERE correo = $1';
    const result = await pool.query(query, [email]);
    
    if (result.rows.length === 0) {
      throw new Error('Usuario no encontrado');
    }
    
    return result.rows[0]; // Retorna el usuario encontrado
  } catch (err) {
    console.error('Error al obtener el usuario por email', err);
    throw err; // Lanza el error para que sea capturado en el controlador
  }
};



const registrarProyecto = async (id_proyecto_cup, nombre, suf) => {
  return await db.query(
    'INSERT INTO proyecto (Id_Proyecto_CUP, Nombre, SUF) VALUES ($1, $2, $3) RETURNING *',
    [id_proyecto_cup, nombre, suf]
  );
};

// Función para registrar un pedido en la base de datos
const registrarPedido = async (data) => {
  const {
    codigo_pedido, fecha, hora, nivel, metros_cuadrados,
    metros_lineales, kilogramos, frisos, chatas, codigo_plano,
    planta, id_proyecto_cup, id_producto, id_usuario, id_transporte, id_oficina
  } = data;

  // Asegúrate de que todas las propiedades están presentes en `data`
  if (!codigo_pedido || !fecha || !hora || !nivel || !metros_cuadrados ||
      !metros_lineales || !kilogramos || !frisos || !chatas || !codigo_plano ||
      !planta || !id_proyecto_cup || !id_producto || !id_usuario || !id_transporte || !id_oficina) {
    throw new Error('Faltan datos obligatorios');
  }

  return await db.query(
    `INSERT INTO detalle_pedido (
      codigo_pedido, fecha, hora, nivel, metros_cuadrados, metros_lineales, 
      kilogramos, frisos, chatas, codigo_plano, planta, id_proyecto_cup, 
      id_producto, id_usuario, id_transporte, id_oficina
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16)
    RETURNING *`, 
    [
      codigo_pedido, fecha, hora, nivel, metros_cuadrados, metros_lineales, 
      kilogramos, frisos, chatas, codigo_plano, planta, id_proyecto_cup, 
      id_producto, id_usuario, id_transporte, id_oficina
    ]
  );
};

const insertarCodigo = async ({ codigo, usuarioId }) => {
  const query = `
    INSERT INTO codigos_validacion (codigo, usuario_id)
    VALUES ($1, $2)
    RETURNING *;
  `;
  
  const values = [codigo, usuarioId];  // Código generado y ID de usuario

  try {
    const result = await pool.query(query, values);
    return result.rows[0];  // Devolvemos el registro insertado
  } catch (err) {
    throw err;  // Propagamos el error para que el controlador lo capture
  }
};



const registrarEnvio = async (data) => {
  const { fecha_envio, observacion, valorizado, facturado, pagado, codigo_pedido } = data;
  return await db.query(
    'INSERT INTO envio (Fecha_Envio, Observacion, Valorizado, Facturado, Pagado, Codigo_Pedido) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *',
    [fecha_envio, observacion, valorizado, facturado, pagado, codigo_pedido]
  );
};

const registrarOficina = async ({ especialidad, id_persona }) => {
  return await db.query(
    'INSERT INTO oficina_tecnica (especialidad, id_persona) VALUES ($1, $2) RETURNING *',
    [especialidad, id_persona] // Pasamos ambos valores a la consulta
  );
};

// Función para actualizar datos

const actualizarPedido = async (codigo_pedido, data) => {
  const {
    fecha, hora, nivel, m2 = 0, ml = 0, kg = 0, 
    frisos_ml = 0, chatas_kg = 0, codigo_plano, planta, id_proyecto_cup, 
    id_producto = null, id_usuario = null, id_transporte = null, id_oficina = null
  } = data;

  return await db.query(
    `UPDATE detalle_pedido 
     SET fecha = $1, hora = $2, nivel = $3, metros_cuadrados = $4, metros_lineales = $5, 
         kilogramos = $6, frisos = $7, chatas = $8, codigo_plano = $9, planta = $10, 
         id_proyecto_cup = $11, id_producto = COALESCE($12, id_producto), 
         id_usuario = COALESCE($13, id_usuario), id_transporte = COALESCE($14, id_transporte), 
         id_oficina = COALESCE($15, id_oficina)
     WHERE codigo_pedido = $16
     RETURNING *`,  // Devolver el pedido actualizado
    [
      fecha, hora, nivel, m2, ml, kg, 
      frisos_ml, chatas_kg, codigo_plano, planta, id_proyecto_cup, id_producto, 
      id_usuario, id_transporte, id_oficina, codigo_pedido
    ]
  );
};

// queries.js
async function verificarCodigo({ codigo, usuarioId }) {
  const query = 'SELECT * FROM codigos_validacion WHERE codigo = $1 AND usuario_id = $2 AND estado = \'activo\'';
  const values = [codigo, usuarioId];

  try {
    const result = await pool.query(query, values);
    return result; // Asegúrate de que result contenga las filas
  } catch (err) {
    console.error('Error en la consulta verificarCodigo:', err);
    throw err;
  }
}

async function eliminarCodigo({ codigo, usuarioId }) {
  const query = 'DELETE FROM codigos_validacion WHERE codigo = $1 AND usuario_id = $2';
  const values = [codigo, usuarioId];
  return await pool.query(query, values);
}


module.exports = {
  getPedidos,
  getProyectos,
  getUsuarios,
  eliminarCodigo,
  getEnvio,
  getTransportes,
  getOficinasTecnicas,
  getProductos,
  registrarCliente,
  registrarProyecto,
  verificarCodigo,
  getUserByEmail,
  registrarPedido,
  registrarEnvio,
  registrarOficina,
  actualizarPedido,
  insertarCodigo
};


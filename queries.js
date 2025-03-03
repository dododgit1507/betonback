const db = require('./db');
const pool = require('./db');

// Funciones para obtener datos

const getPedidos = async () => {
  return await pool.query(`
     SELECT
        pr.nombre AS nombre_proyecto_cup,
        dp.codigo_pedido,
        prod.tipo AS nombre_producto,
        ofi.especialidad AS oficina_especialidad,
        per_ofi.nombre AS nombre_oficina,  -- Persona vinculada con la oficina técnica
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
        per.nombre AS nombre_usuario,  -- Usuario que hizo el pedido
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
    JOIN persona per_ofi ON ofi.id_persona = per_ofi.id_persona;  -- Corrección aquí
    `);
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



const registrarEnvio = async (data) => {
  const { fecha_envio, observacion, valorizado, facturado, pagado, codigo_pedido } = data;
  return await db.query(
    'INSERT INTO envio (Fecha_Envio, Observacion, Valorizado, Facturado, Pagado, Codigo_Pedido) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *',
    [fecha_envio, observacion, valorizado, facturado, pagado, codigo_pedido]
  );
};

const registrarOficina = async (especialidad) => {
  return await db.query(
    'INSERT INTO oficina_tecnica (especialidad) VALUES ($1) RETURNING *',
    [especialidad]
  );
};





// Función para actualizar datos

const actualizarPedido = async (codigo_pedido, data) => {
  const {
    fecha, hora, nivel, metros_cuadrados, metros_lineales, kilogramos, frisos, chatas,
    codigo_plano, planta, id_proyecto_cup, id_producto, id_usuario, id_transporte, id_oficina
  } = data;

  return await db.query(
    `UPDATE detalle_pedido 
     SET Fecha = $1, Hora = $2, Nivel = $3, Metros_Cuadrados = $4, Metros_Lineales = $5, 
         Kilogramos = $6, Frisos = $7, Chatas = $8, Codigo_Plano = $9, Planta = $10,
         Id_Proyecto_CUP = $11, Id_Producto = $12, Id_Usuario = $13, Id_Transporte = $14, 
         Id_Oficina = $15
     WHERE Codigo_Pedido = $16
     RETURNING *`,
    [
      fecha, hora, nivel, metros_cuadrados, metros_lineales, kilogramos, frisos, chatas,
      codigo_plano, planta, id_proyecto_cup, id_producto, id_usuario, id_transporte,
      id_oficina, codigo_pedido
    ]
  );
};

module.exports = {
  getPedidos,
  getProyectos,
  getUsuarios,
  getEnvio,
  getTransportes,
  getOficinasTecnicas,
  getProductos,
  registrarCliente,
  registrarProyecto,
  getUserByEmail,
  registrarPedido,
  registrarEnvio,
  registrarOficina,
  actualizarPedido
};


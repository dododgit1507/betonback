const db = require('./db');
const pool = require('./db');

// Funciones para obtener datos

const getPedidos = async () => {
    return await pool.query('SELECT * FROM detalle_pedido');
     
};


const getProyectos = async () => {
  return await db.query('SELECT * FROM proyecto');
};

const getUsuarios = async () => {
  return await db.query('SELECT * FROM usuario');
};

const getTransportes = async () => {
  return await db.query('SELECT * FROM transporte');
};

const getOficinasTecnicas = async () => {
  return await db.query('SELECT * FROM oficina_tecnica');
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


const registrarProyecto = async (id_proyecto_cup, nombre, suf) => {
  return await db.query(
    'INSERT INTO proyecto (Id_Proyecto_CUP, Nombre, SUF) VALUES ($1, $2, $3) RETURNING *',
    [id_proyecto_cup, nombre, suf]
  );
};

const registrarPedido = async (data) => {
  const {
    codigo_pedido, fecha, hora, nivel, metros_cuadrados, metros_lineales, kilogramos,
    frisos, chatas, codigo_plano, planta, id_proyecto_cup, id_producto, id_usuario,
    id_transporte, id_oficina
  } = data;

  try {
    const result = await db.query(
      `INSERT INTO detalle_pedido 
      (Codigo_Pedido, Fecha, Hora, Nivel, Metros_Cuadrados, Metros_Lineales, Kilogramos,
      Frisos, Chatas, Codigo_Plano, Planta, Id_Proyecto_CUP, Id_Producto, Id_Usuario,
      Id_Transporte, Id_Oficina) 
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16)
      RETURNING *`,
      [
        codigo_pedido, fecha, hora, nivel, metros_cuadrados, metros_lineales, kilogramos,
        frisos, chatas, codigo_plano, planta, id_proyecto_cup, id_producto, id_usuario,
        id_transporte, id_oficina
      ]
    );

    return result.rows[0];
  } catch (error) {
    console.error('Error al registrar el pedido:', error);
    throw error;
  }
};

const registrarEnvio = async (data) => {
  const { fecha_envio, observacion, valorizado, facturado, pagado, codigo_pedido } = data;
  return await db.query(
    'INSERT INTO envio (Fecha_Envio, Observacion, Valorizado, Facturado, Pagado, Codigo_Pedido) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *',
    [fecha_envio, observacion, valorizado, facturado, pagado, codigo_pedido]
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
  getTransportes,
  getOficinasTecnicas,
  getProductos,
  registrarCliente,
  registrarProyecto,
  registrarPedido,
  registrarEnvio,
  actualizarPedido
};

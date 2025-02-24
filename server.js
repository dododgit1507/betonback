const express = require('express');
const sequelize = require('./config/db.config');
const personaRoutes = require('./routes/persona.routes');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());

// Rutas
app.use('/api/personas', personaRoutes);

// Conectar a la base de datos y arrancar el servidor
sequelize.sync().then(() => {
  app.listen(PORT, () => {
    console.log(`Servidor corriendo en el puerto ${PORT}`);
  });
}).catch((error) => {
  console.error('Error al conectar con la base de datos:', error);
});

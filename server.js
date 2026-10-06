require('dotenv').config();
const path = require('path');
const express = require('express');
const cookieParser = require('cookie-parser');

const { sequelize, crearBaseDeDatos, usaNube, DB_NAME } = require('./src/config/db');
const { migrar } = require('./src/models');
const { sembrar } = require('./src/seed');
const { entidades, secciones } = require('./src/config/entidades');
const { attachUser } = require('./src/middleware/auth');
const apiRouter = require('./src/routes/api');
const webRouter = require('./src/routes/web');

const app = express();
app.set('trust proxy', 1); // Render esta detras de un proxy HTTPS
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));
app.use(attachUser);

// Menu de la barra de navegacion segun el rol: Ventas / Compras / Almacen
app.use((req, res, next) => {
  res.locals.menuNav = req.user
    ? secciones
        .map((s) => ({
          clave: s.clave,
          titulo: s.titulo,
          items: Object.entries(entidades)
            .filter(([, c]) => c.seccion === s.clave && c.ver.includes(req.user.role))
            .map(([clave, c]) => ({ clave, titulo: c.titulo })),
        }))
        .filter((s) => s.items.length)
    : [];
  next();
});

app.use('/api', apiRouter);
app.use('/', webRouter);

// 404
app.use((req, res) => {
  if (req.path.startsWith('/api')) return res.status(404).json({ error: 'Ruta no encontrada.' });
  res.status(404).render('error', { codigo: 404, mensaje: 'La página que buscas no existe.' });
});

// Errores no controlados
// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => {
  console.error(err);
  if (req.path.startsWith('/api')) return res.status(500).json({ error: 'Error interno del servidor.' });
  res.status(500).render('error', { codigo: 500, mensaje: 'Ocurrió un error interno.' });
});

const PORT = process.env.PORT || 3000;

(async () => {
  try {
    await crearBaseDeDatos(); // crea db_farmacia con Sequelize si no existe
    await sequelize.authenticate();
    await sequelize.sync(); // crea las tablas y sus relaciones
    await migrar(); // ajusta tablas de versiones anteriores (columna codEspec)
    await sembrar(); // inserta registros iniciales
    app.listen(PORT, (err) => {
      if (err) {
        console.error(`No se pudo usar el puerto ${PORT}: ${err.message}`);
        process.exit(1);
      }
      console.log(`Servidor listo en http://localhost:${PORT}  (BD: ${usaNube ? 'PostgreSQL en la nube' : 'MySQL ' + DB_NAME})`);
    });
  } catch (e) {
    console.error('No se pudo iniciar la aplicación:', e.message);
    process.exit(1);
  }
})();

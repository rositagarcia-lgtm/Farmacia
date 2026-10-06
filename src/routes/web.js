const express = require('express');
const models = require('../models');
const { entidades } = require('../config/entidades');
const { pageAuth, pageRole } = require('../middleware/auth');

const { User, ROLES } = models;
const router = express.Router();

router.get('/', (req, res) => res.redirect(req.user ? '/menu' : '/login'));

router.get('/login', (req, res) => (req.user ? res.redirect('/menu') : res.render('login', { titulo: 'Iniciar sesión' })));
router.get('/register', (req, res) => (req.user ? res.redirect('/menu') : res.render('register', { titulo: 'Crear cuenta' })));

// Menu principal: se accede al iniciar sesion
router.get('/menu', pageAuth, (req, res) => res.render('menu', { titulo: 'Menú principal', activo: 'menu' }));

// ---------- helpers para las tablas ----------
const obtener = (obj, ruta) => ruta.split('.').reduce((o, k) => (o == null ? o : o[k]), obj);
const valor = (fila, col) => {
  const v = obtener(fila, col.key);
  if (v === null || v === undefined || v === '') return '-';
  return col.formato === 'money' ? 'S/ ' + Number(v).toFixed(2) : String(v);
};

// Opciones de los <select> que apuntan a otra tabla (ref)
async function cargarOpciones(cfg) {
  const refs = new Set();
  [...cfg.campos, ...(cfg.detalle ? cfg.detalle.campos : [])].forEach((c) => c.ref && refs.add(c.ref));
  const opciones = {};
  for (const ref of refs) {
    const e = entidades[ref];
    const filas = await models[e.modelo].findAll({ order: [[e.etiqueta, 'ASC']] });
    opciones[ref] = filas.map((f) => ({
      value: f[e.pk],
      label: f[e.etiqueta],
      ...Object.fromEntries(Object.entries(e.opcionExtra || {}).map(([k, campo]) => [k, f[campo]])),
    }));
  }
  return opciones;
}

// Una pagina por cada modulo: /clientes, /ventas, /laboratorios, /compras, /medicamentos, /tipos, /especialidades
for (const [clave, cfg] of Object.entries(entidades)) {
  router.get('/' + clave, pageAuth, pageRole(...cfg.ver), async (req, res) => {
    const include = (cfg.include || []).map((i) => ({ model: models[i.modelo], as: i.as }));
    const filas = (await models[cfg.modelo].findAll({ include, order: cfg.orden })).map((f) => f.get({ plain: true }));
    const puede = { editar: cfg.editar.includes(req.user.role), eliminar: cfg.eliminar.includes(req.user.role) };

    // Configuracion que se envia al navegador (formularios y validacion en el front)
    const { modelo, include: _include, orden, ver, editar, eliminar, ...cliente } = cfg;
    const datos = { cfg: { ...cliente, ruta: clave }, opciones: await cargarOpciones(cfg), puede };

    res.render('catalogo', {
      titulo: cfg.titulo, activo: clave, cfg, filas, puede, valor,
      datosJson: JSON.stringify(datos).replace(/</g, '\\u003c'),
    });
  });
}

// Usuarios: solo administrador
router.get('/usuarios', pageAuth, pageRole('administrador'), async (req, res) => {
  const usuarios = await User.findAll({ attributes: ['id', 'nombre', 'email', 'role', 'createdAt'], order: [['id', 'ASC']] });
  res.render('usuarios', { titulo: 'Usuarios', activo: 'usuarios', usuarios, ROLES });
});

module.exports = router;

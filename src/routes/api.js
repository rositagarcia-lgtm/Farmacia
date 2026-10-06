const express = require('express');
const bcrypt = require('bcryptjs');
const { User, ROLES } = require('../models');
const { firmarToken, opcionesCookie, apiAuth, apiRole } = require('../middleware/auth');
const { crearRouter, entidades } = require('./crud');

const router = express.Router();
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const limpiar = (v) => (typeof v === 'string' ? v.trim() : '');
const clavesPassword = (p) => typeof p === 'string' && p.length >= 8 && /[A-Za-z]/.test(p) && /\d/.test(p);

// AUTENTICACION (JWT)
router.post('/auth/register', async (req, res) => {
  const nombre = limpiar(req.body.nombre);
  const email = limpiar(req.body.email).toLowerCase();
  const { password } = req.body;

  if (nombre.length < 3) return res.status(400).json({ error: 'El nombre debe tener al menos 3 caracteres.' });
  if (!EMAIL_RE.test(email)) return res.status(400).json({ error: 'Correo electrónico inválido.' });
  if (!clavesPassword(password))
    return res.status(400).json({ error: 'La contraseña debe tener mínimo 8 caracteres, con letras y números.' });

  if (await User.findOne({ where: { email } }))
    return res.status(409).json({ error: 'Ya existe una cuenta con ese correo.' });

  // El rol NO se toma del cliente: todo registro nuevo es 'usuario'.
  const user = await User.create({ nombre, email, password: await bcrypt.hash(password, 10), role: 'usuario' });
  res.cookie('token', firmarToken(user), opcionesCookie(req));
  res.status(201).json({ mensaje: 'Cuenta creada', user: { id: user.id, nombre, email, role: user.role } });
});

router.post('/auth/login', async (req, res) => {
  const email = limpiar(req.body.email).toLowerCase();
  const { password } = req.body;
  if (!EMAIL_RE.test(email) || typeof password !== 'string' || !password)
    return res.status(400).json({ error: 'Ingresa tu correo y contraseña.' });

  const user = await User.findOne({ where: { email } });
  const ok = user && (await bcrypt.compare(password, user.password));
  if (!ok) return res.status(401).json({ error: 'Credenciales incorrectas.' });

  const token = firmarToken(user);
  res.cookie('token', token, opcionesCookie(req));
  res.json({ mensaje: 'Sesión iniciada', token, user: { id: user.id, nombre: user.nombre, email, role: user.role } });
});

router.post('/auth/logout', (req, res) => {
  res.clearCookie('token', { httpOnly: true, sameSite: 'lax', secure: req.secure });
  res.json({ mensaje: 'Sesión cerrada' });
});

router.get('/auth/me', apiAuth, (req, res) => res.json({ user: req.user }));

// CRUD de las tablas (clientes, ventas, laboratorios, compras, medicamentos, tipos, especialidades)
for (const [clave, cfg] of Object.entries(entidades)) {
  router.use('/' + clave, crearRouter(cfg));
}

// USUARIOS (solo administrador)
router.get('/usuarios', apiAuth, apiRole('administrador'), async (req, res) => {
  res.json(await User.findAll({ attributes: ['id', 'nombre', 'email', 'role', 'createdAt'], order: [['id', 'ASC']] }));
});

router.put('/usuarios/:id/rol', apiAuth, apiRole('administrador'), async (req, res) => {
  const { role } = req.body;
  if (!ROLES.includes(role)) return res.status(400).json({ error: 'Rol inválido.' });
  const u = await User.findByPk(req.params.id);
  if (!u) return res.status(404).json({ error: 'Usuario no encontrado.' });
  if (u.id === req.user.id) return res.status(400).json({ error: 'No puedes cambiar tu propio rol.' });
  await u.update({ role });
  res.json({ mensaje: 'Rol actualizado' });
});

router.delete('/usuarios/:id', apiAuth, apiRole('administrador'), async (req, res) => {
  const u = await User.findByPk(req.params.id);
  if (!u) return res.status(404).json({ error: 'Usuario no encontrado.' });
  if (u.id === req.user.id) return res.status(400).json({ error: 'No puedes eliminar tu propia cuenta.' });
  await u.destroy();
  res.json({ mensaje: 'Usuario eliminado' });
});

module.exports = router;

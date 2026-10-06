const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const { User } = require('../models');

// Si no se define JWT_SECRET se genera uno aleatorio (los tokens se invalidan al reiniciar).
let SECRET = process.env.JWT_SECRET;
if (!SECRET) {
  SECRET = crypto.randomBytes(32).toString('hex');
  console.warn('[AVISO] JWT_SECRET no definido: se uso uno temporal. Defínelo en .env / Render.');
}
const EXPIRA = '2h';
const EXPIRA_MS = 2 * 60 * 60 * 1000;

function firmarToken(user) {
  return jwt.sign({ id: user.id }, SECRET, { expiresIn: EXPIRA });
}

function opcionesCookie(req) {
  return {
    httpOnly: true,
    sameSite: 'lax',
    secure: req.secure, // true en Render (HTTPS) gracias a "trust proxy"
    maxAge: EXPIRA_MS,
  };
}

function leerToken(req) {
  const h = req.headers.authorization;
  if (h && h.startsWith('Bearer ')) return h.slice(7);
  return req.cookies && req.cookies.token;
}

// Lee el JWT (cookie o header Bearer) y carga el usuario real desde la BD,
// asi el rol siempre esta actualizado y un usuario borrado pierde el acceso.
async function attachUser(req, res, next) {
  req.user = null;
  res.locals.user = null;
  const token = leerToken(req);
  if (token) {
    try {
      const payload = jwt.verify(token, SECRET);
      const u = await User.findByPk(payload.id, { attributes: ['id', 'nombre', 'email', 'role'] });
      if (u) {
        req.user = u.get({ plain: true });
        res.locals.user = req.user;
      }
    } catch (e) {
      /* token invalido o expirado: se trata como no autenticado */
    }
  }
  next();
}

const apiAuth = (req, res, next) =>
  req.user ? next() : res.status(401).json({ error: 'No autenticado. Inicia sesión.' });

const apiRole = (...roles) => (req, res, next) =>
  roles.includes(req.user.role)
    ? next()
    : res.status(403).json({ error: 'No tienes permisos para esta acción.' });

const pageAuth = (req, res, next) => (req.user ? next() : res.redirect('/login'));

const pageRole = (...roles) => (req, res, next) =>
  roles.includes(req.user.role)
    ? next()
    : res.status(403).render('error', { codigo: 403, mensaje: 'No tienes permisos para ver esta página.' });

module.exports = { firmarToken, opcionesCookie, attachUser, apiAuth, apiRole, pageAuth, pageRole };

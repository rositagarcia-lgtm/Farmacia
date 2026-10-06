const models = require('../models');
const { entidades } = require('./entidades');

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const TEL_RE = /^[0-9+\-\s()]{6,20}$/;
const FECHA_RE = /^\d{4}-\d{2}-\d{2}$/;

// Valida el cuerpo de una peticion segun la lista de campos de la configuracion.
// Devuelve { datos } o { error }.
async function validar(campos, body) {
  const datos = {};
  const etiquetas = {};

  for (const c of campos) {
    etiquetas[c.name] = c.label;
    let v = body[c.name];
    if (typeof v === 'string') v = v.trim();
    const vacio = v === undefined || v === null || v === '';

    if (vacio) {
      if (c.requerido === false) { datos[c.name] = null; continue; }
      return { error: `${c.label} es obligatorio.` };
    }

    switch (c.tipo) {
      case 'text':
      case 'tel':
      case 'email': {
        if (typeof v !== 'string') return { error: `${c.label} no es válido.` };
        const min = c.min || 1;
        if (v.length < min) return { error: `${c.label} debe tener al menos ${min} caracteres.` };
        if (v.length > (c.max || 150)) return { error: `${c.label} es demasiado largo.` };
        if (c.tipo === 'email' && !EMAIL_RE.test(v)) return { error: 'Correo electrónico inválido.' };
        if (c.tipo === 'tel' && !TEL_RE.test(v)) return { error: 'Teléfono inválido (solo números, 6 a 20 dígitos).' };
        datos[c.name] = v;
        break;
      }
      case 'date':
        if (!FECHA_RE.test(String(v)) || Number.isNaN(Date.parse(v))) return { error: `${c.label} no es una fecha válida.` };
        datos[c.name] = v;
        break;
      case 'int': {
        const n = Number(v);
        const min = c.valorMin ?? 0;
        if (!Number.isInteger(n) || n < min) return { error: `${c.label} debe ser un entero mayor o igual a ${min}.` };
        datos[c.name] = n;
        break;
      }
      case 'decimal': {
        const n = Number(v);
        const min = c.valorMin ?? 0;
        if (!Number.isFinite(n) || n < min) return { error: `${c.label} debe ser un número mayor o igual a ${min}.` };
        datos[c.name] = n;
        break;
      }
      case 'select':
        if (c.ref) {
          const id = Number(v);
          const modelo = models[entidades[c.ref].modelo];
          if (!Number.isInteger(id) || id < 1 || !(await modelo.findByPk(id))) return { error: `${c.label} no es válido.` };
          datos[c.name] = id;
        } else {
          if (!c.opciones.includes(v)) return { error: `${c.label} no es válido.` };
          datos[c.name] = v;
        }
        break;
      default:
        return { error: 'Campo desconocido.' };
    }
  }

  for (const c of campos) {
    if (c.despuesDe && datos[c.name] && datos[c.despuesDe] && datos[c.name] <= datos[c.despuesDe]) {
      return { error: `${c.label} debe ser posterior a ${etiquetas[c.despuesDe].toLowerCase()}.` };
    }
  }
  return { datos };
}

module.exports = { validar };

const express = require('express');
const models = require('../models');
const { entidades } = require('../config/entidades');
const { validar } = require('../config/validar');
const { apiAuth, apiRole } = require('../middleware/auth');

const esErrorFK = (e) => e && e.name === 'SequelizeForeignKeyConstraintError';
const ERROR_FK = 'No se puede eliminar: tiene registros relacionados.';

// Crea el CRUD (con Sequelize) de una entidad de config/entidades.js
function crearRouter(cfg) {
  const router = express.Router();
  const Modelo = models[cfg.modelo];
  const include = (cfg.include || []).map((i) => ({ model: models[i.modelo], as: i.as }));

  router.get('/', apiAuth, apiRole(...cfg.ver), async (req, res) => {
    res.json(await Modelo.findAll({ include, order: cfg.orden }));
  });

  router.post('/', apiAuth, apiRole(...cfg.editar), async (req, res) => {
    const { datos, error } = await validar(cfg.campos, req.body);
    if (error) return res.status(400).json({ error });
    try {
      res.status(201).json(await Modelo.create(datos));
    } catch (e) {
      if (e.name === 'SequelizeUniqueConstraintError') return res.status(409).json({ error: 'Ya existe un registro con ese valor.' });
      throw e;
    }
  });

  router.put('/:id', apiAuth, apiRole(...cfg.editar), async (req, res) => {
    const fila = await Modelo.findByPk(req.params.id);
    if (!fila) return res.status(404).json({ error: 'Registro no encontrado.' });
    const { datos, error } = await validar(cfg.campos, req.body);
    if (error) return res.status(400).json({ error });
    try {
      await fila.update(datos);
      res.json(fila);
    } catch (e) {
      if (e.name === 'SequelizeUniqueConstraintError') return res.status(409).json({ error: 'Ya existe un registro con ese valor.' });
      throw e;
    }
  });

  router.delete('/:id', apiAuth, apiRole(...cfg.eliminar), async (req, res) => {
    const fila = await Modelo.findByPk(req.params.id);
    if (!fila) return res.status(404).json({ error: 'Registro no encontrado.' });
    try {
      await fila.destroy();
      res.json({ mensaje: 'Registro eliminado' });
    } catch (e) {
      if (esErrorFK(e)) return res.status(409).json({ error: ERROR_FK });
      throw e;
    }
  });

  // ---------- Detalle de ordenes (DetalleOrdenVta / DetalleOrdenCompra) ----------
  if (cfg.detalle) {
    const d = cfg.detalle;
    const Detalle = models[d.modelo];

    const recalcular = async (orden) => {
      if (!cfg.totalCampo || !d.monto) return;
      const suma = (await Detalle.sum(d.monto.campo, { where: { [d.fkOrden]: orden[cfg.pk] } })) || 0;
      await orden.update({ [cfg.totalCampo]: suma });
    };

    router.get('/:id/detalle', apiAuth, apiRole(...cfg.ver), async (req, res) => {
      const orden = await Modelo.findByPk(req.params.id);
      if (!orden) return res.status(404).json({ error: 'Orden no encontrada.' });
      res.json(await Detalle.findAll({ where: { [d.fkOrden]: orden[cfg.pk] }, order: [['codMedicamento', 'ASC']] }));
    });

    router.post('/:id/detalle', apiAuth, apiRole(...cfg.editar), async (req, res) => {
      const orden = await Modelo.findByPk(req.params.id);
      if (!orden) return res.status(404).json({ error: 'Orden no encontrada.' });
      const { datos, error } = await validar(d.campos, req.body);
      if (error) return res.status(400).json({ error });

      const med = await models.Medicamento.findByPk(datos.codMedicamento);
      const fila = { ...datos, [d.fkOrden]: orden[cfg.pk], [d.descCampo]: med.descripcionMed };
      if (d.monto) {
        // El precio siempre sale del medicamento, nunca del cliente
        const precio = Number(med[d.monto.precioDe]);
        fila[d.monto.precio] = precio;
        fila[d.monto.campo] = Number((datos[d.monto.cantidad] * precio).toFixed(2));
      }

      // Si el medicamento ya esta en la orden, se actualiza la linea
      const existente = await Detalle.findOne({ where: { [d.fkOrden]: orden[cfg.pk], codMedicamento: med.codMedicamento } });
      if (existente) await existente.update(fila);
      else await Detalle.create(fila);

      await recalcular(orden);
      res.status(201).json({ mensaje: 'Detalle guardado' });
    });

    router.delete('/:id/detalle/:codMed', apiAuth, apiRole(...cfg.editar), async (req, res) => {
      const orden = await Modelo.findByPk(req.params.id);
      if (!orden) return res.status(404).json({ error: 'Orden no encontrada.' });
      const linea = await Detalle.findOne({ where: { [d.fkOrden]: orden[cfg.pk], codMedicamento: req.params.codMed } });
      if (!linea) return res.status(404).json({ error: 'Línea no encontrada.' });
      await linea.destroy();
      await recalcular(orden);
      res.json({ mensaje: 'Línea eliminada' });
    });
  }

  return router;
}

module.exports = { crearRouter, entidades };

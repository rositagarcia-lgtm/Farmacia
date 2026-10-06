const bcrypt = require('bcryptjs');
const {
  User, Cliente, TipoMedic, Especialidad, Laboratorio, Medicamento,
  OrdenVenta, DetalleOrdenVta, OrdenCompra, DetalleOrdenCompra,
} = require('./models');

async function sembrar() {
  // ---------------- Usuarios de prueba (uno por rol) ----------------
  const demo = [
    { nombre: 'Administrador', email: 'admin@farmacia.com', clave: 'Admin123', role: 'administrador' },
    { nombre: 'Moderador', email: 'moderador@farmacia.com', clave: 'Moder123', role: 'moderador' },
    { nombre: 'Usuario', email: 'usuario@farmacia.com', clave: 'Usuario123', role: 'usuario' },
  ];
  for (const u of demo) {
    const [, creado] = await User.findOrCreate({
      where: { email: u.email },
      defaults: { nombre: u.nombre, password: bcrypt.hashSync(u.clave, 10), role: u.role },
    });
    if (creado) console.log('Usuario de prueba creado:', u.email);
  }

  // ---------------- Clientes ----------------
  if ((await Cliente.count()) === 0) {
    await Cliente.bulkCreate([
      { nombre: 'Luis Alberto', apellidos: 'Coello', direccion: 'Ate' },
      { nombre: 'Andrés', apellidos: 'Torres', direccion: 'Ate' },
      { nombre: 'Ricardo', apellidos: 'Coello Palomino', direccion: 'Ate' },
    ]);
    console.log('Clientes insertados');
  }

  // ---------------- Tipos y especialidades ----------------
  if ((await TipoMedic.count()) === 0) {
    await TipoMedic.bulkCreate([
      { descripcion: 'Analgésico' }, { descripcion: 'Antibiótico' },
      { descripcion: 'Antiinflamatorio' }, { descripcion: 'Antialérgico' },
    ]);
    console.log('Tipos de medicamento insertados');
  }
  if ((await Especialidad.count()) === 0) {
    await Especialidad.bulkCreate([
      { descripcionEsp: 'Medicina General' }, { descripcionEsp: 'Infectología' },
      { descripcionEsp: 'Traumatología' }, { descripcionEsp: 'Alergología' },
    ]);
    console.log('Especialidades insertadas');
  }

  const tipos = await TipoMedic.findAll();
  const especialidades = await Especialidad.findAll();
  const tipo = (n) => tipos.find((t) => t.descripcion === n).codTipoMed;
  const espec = (n) => especialidades.find((e) => e.descripcionEsp === n).codEspec;

  // ---------------- Medicamentos ----------------
  if ((await Medicamento.count()) === 0) {
    await Medicamento.bulkCreate([
      { descripcionMed: 'Paracetamol 500 mg', fechaFabricacion: '2025-01-10', fechaVencimiento: '2027-01-10', presentacion: 'Caja x 100 tabletas', stock: 250, precioVentaUni: 0.5, precioVentaPres: 45, marca: 'Genfar', codTipoMed: tipo('Analgésico'), codEspec: espec('Medicina General') },
      { descripcionMed: 'Ibuprofeno 400 mg', fechaFabricacion: '2025-03-05', fechaVencimiento: '2027-03-05', presentacion: 'Caja x 50 tabletas', stock: 180, precioVentaUni: 0.8, precioVentaPres: 38, marca: 'MK', codTipoMed: tipo('Antiinflamatorio'), codEspec: espec('Traumatología') },
      { descripcionMed: 'Amoxicilina 500 mg', fechaFabricacion: '2025-02-01', fechaVencimiento: '2026-12-01', presentacion: 'Caja x 21 cápsulas', stock: 90, precioVentaUni: 1.2, precioVentaPres: 24, marca: 'Portugal', codTipoMed: tipo('Antibiótico'), codEspec: espec('Infectología') },
      { descripcionMed: 'Loratadina 10 mg', fechaFabricacion: '2025-04-12', fechaVencimiento: '2027-04-12', presentacion: 'Caja x 10 tabletas', stock: 140, precioVentaUni: 0.6, precioVentaPres: 5.5, marca: 'Bayer', codTipoMed: tipo('Antialérgico'), codEspec: espec('Alergología') },
      { descripcionMed: 'Diclofenaco 50 mg', fechaFabricacion: '2025-05-20', fechaVencimiento: '2027-05-20', presentacion: 'Caja x 30 tabletas', stock: 75, precioVentaUni: 0.9, precioVentaPres: 25, marca: 'Genfar', codTipoMed: tipo('Antiinflamatorio'), codEspec: espec('Traumatología') },
      { descripcionMed: 'Azitromicina 500 mg', fechaFabricacion: '2025-06-15', fechaVencimiento: '2027-06-15', presentacion: 'Caja x 3 tabletas', stock: 60, precioVentaUni: 4.5, precioVentaPres: 12, marca: 'Pfizer', codTipoMed: tipo('Antibiótico'), codEspec: espec('Infectología') },
    ]);
    console.log('Medicamentos insertados');
  }

  // Medicamentos de una version anterior (sin especialidad): se completan segun su tipo
  const porTipo = {
    'Analgésico': 'Medicina General', 'Antibiótico': 'Infectología',
    'Antiinflamatorio': 'Traumatología', 'Antialérgico': 'Alergología',
  };
  for (const t of tipos) {
    if (porTipo[t.descripcion]) {
      await Medicamento.update({ codEspec: espec(porTipo[t.descripcion]) }, { where: { codTipoMed: t.codTipoMed, codEspec: null } });
    }
  }

  const meds = await Medicamento.findAll({ order: [['codMedicamento', 'ASC']] });

  // ---------------- Laboratorios ----------------
  if ((await Laboratorio.count()) === 0) {
    await Laboratorio.bulkCreate([
      { razonSocial: 'Laboratorios Genfar S.A.', direccion: 'Av. Industrial 450, Lima', telefono: '014567890', email: 'ventas@genfar.com', contacto: 'María Torres' },
      { razonSocial: 'Bayer Perú S.A.', direccion: 'Av. Javier Prado 1200, San Isidro', telefono: '012223344', email: 'contacto@bayer.pe', contacto: 'Carlos Ruiz' },
      { razonSocial: 'Pfizer Perú S.R.L.', direccion: 'Calle Los Cedros 88, Surco', telefono: '017778899', email: 'pedidos@pfizer.pe', contacto: 'Lucía Paredes' },
    ]);
    console.log('Laboratorios insertados');
  }
  const labs = await Laboratorio.findAll({ order: [['codLab', 'ASC']] });

  // ---------------- Ordenes de venta y su detalle ----------------
  if ((await OrdenVenta.count()) === 0) {
    const v1 = await OrdenVenta.create({ fechaEmision: '2026-09-20', motivo: 'Venta mostrador', situacion: 'Atendida' });
    const v2 = await OrdenVenta.create({ fechaEmision: '2026-09-28', motivo: 'Pedido de clínica', situacion: 'Pendiente' });
    await DetalleOrdenVta.bulkCreate([
      { nroOrdenVta: v1.nroOrdenVta, codMedicamento: meds[0].codMedicamento, descripcionMed: meds[0].descripcionMed, cantidadRequerida: 20 },
      { nroOrdenVta: v1.nroOrdenVta, codMedicamento: meds[3].codMedicamento, descripcionMed: meds[3].descripcionMed, cantidadRequerida: 5 },
      { nroOrdenVta: v2.nroOrdenVta, codMedicamento: meds[2].codMedicamento, descripcionMed: meds[2].descripcionMed, cantidadRequerida: 30 },
    ]);
    console.log('Órdenes de venta insertadas');
  }

  // ---------------- Ordenes de compra y su detalle ----------------
  if ((await OrdenCompra.count()) === 0) {
    const lineas = (orden, items) =>
      items.map(([m, cantidad, precio]) => ({
        nroOrdenC: orden.nroOrdenC, codMedicamento: m.codMedicamento, descripcion: m.descripcionMed,
        cantidad, precio, montouni: Number((cantidad * precio).toFixed(2)),
      }));

    const c1 = await OrdenCompra.create({ fechaEmision: '2026-09-10', situacion: 'Atendida', codLab: labs[0].codLab, nroFacturaProv: 'F001-00231' });
    const c2 = await OrdenCompra.create({ fechaEmision: '2026-09-25', situacion: 'Pendiente', codLab: labs[2].codLab });
    const d1 = lineas(c1, [[meds[0], 200, 0.3], [meds[4], 100, 0.55]]);
    const d2 = lineas(c2, [[meds[5], 40, 3.1]]);
    await DetalleOrdenCompra.bulkCreate([...d1, ...d2]);
    await c1.update({ total: d1.reduce((s, l) => s + l.montouni, 0) });
    await c2.update({ total: d2.reduce((s, l) => s + l.montouni, 0) });
    console.log('Órdenes de compra insertadas');
  }
}

module.exports = { sembrar };

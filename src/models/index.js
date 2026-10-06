const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');

// Funcion (no objeto compartido): Sequelize modifica la definicion de cada atributo
const pk = () => ({ type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true });
const sinFechas = { timestamps: false };

// 
// Usuarios (autenticacion JWT y roles)
const ROLES = ['administrador', 'moderador', 'usuario'];

const User = sequelize.define(
  'User',
  {
    id: pk(),
    nombre: { type: DataTypes.STRING(100), allowNull: false },
    email: { type: DataTypes.STRING(150), allowNull: false, unique: true },
    password: { type: DataTypes.STRING(100), allowNull: false },
    role: { type: DataTypes.ENUM(...ROLES), allowNull: false, defaultValue: 'usuario' },
  },
  { tableName: 'usuarios' }
);

// Tablas de bd_farmacia
const TipoMedic = sequelize.define(
  'TipoMedic',
  {
    codTipoMed: pk(),
    descripcion: { type: DataTypes.STRING(100), allowNull: false, unique: true },
  },
  { tableName: 'tipo_medic', ...sinFechas }
);

const Especialidad = sequelize.define(
  'Especialidad',
  {
    codEspec: pk(),
    descripcionEsp: { type: DataTypes.STRING(100), allowNull: false, unique: true },
  },
  { tableName: 'especialidad', ...sinFechas }
);

const Laboratorio = sequelize.define(
  'Laboratorio',
  {
    codLab: pk(),
    razonSocial: { type: DataTypes.STRING(150), allowNull: false },
    direccion: { type: DataTypes.STRING(200) },
    telefono: { type: DataTypes.STRING(20), allowNull: false },
    email: { type: DataTypes.STRING(150), allowNull: false },
    contacto: { type: DataTypes.STRING(100) },
  },
  { tableName: 'laboratorio', ...sinFechas }
);

const Cliente = sequelize.define(
  'Cliente',
  {
    codCliente: pk(),
    nombre: { type: DataTypes.STRING(100), allowNull: false },
    apellidos: { type: DataTypes.STRING(100), allowNull: false },
    direccion: { type: DataTypes.STRING(200), allowNull: false },
  },
  { tableName: 'cliente', ...sinFechas }
);

const Medicamento = sequelize.define(
  'Medicamento',
  {
    codMedicamento: pk(),
    descripcionMed: { type: DataTypes.STRING(150), allowNull: false },
    fechaFabricacion: { type: DataTypes.DATEONLY, allowNull: false },
    fechaVencimiento: { type: DataTypes.DATEONLY, allowNull: false },
    presentacion: { type: DataTypes.STRING(100), allowNull: false },
    stock: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
    precioVentaUni: { type: DataTypes.DECIMAL(10, 2), allowNull: false },
    precioVentaPres: { type: DataTypes.DECIMAL(10, 2), allowNull: false },
    marca: { type: DataTypes.STRING(100), allowNull: false },
    codTipoMed: { type: DataTypes.INTEGER, allowNull: false },
    codEspec: { type: DataTypes.INTEGER },
  },
  { tableName: 'medicamento', ...sinFechas }
);

const OrdenVenta = sequelize.define(
  'OrdenVenta',
  {
    nroOrdenVta: pk(),
    fechaEmision: { type: DataTypes.DATEONLY, allowNull: false },
    motivo: { type: DataTypes.STRING(150), allowNull: false },
    situacion: { type: DataTypes.STRING(20), allowNull: false, defaultValue: 'Pendiente' },
  },
  { tableName: 'orden_venta', ...sinFechas }
);

const DetalleOrdenVta = sequelize.define(
  'DetalleOrdenVta',
  {
    nroOrdenVta: { type: DataTypes.INTEGER, primaryKey: true },
    codMedicamento: { type: DataTypes.INTEGER, primaryKey: true },
    descripcionMed: { type: DataTypes.STRING(150), allowNull: false },
    cantidadRequerida: { type: DataTypes.INTEGER, allowNull: false },
  },
  { tableName: 'detalle_orden_vta', ...sinFechas }
);

const OrdenCompra = sequelize.define(
  'OrdenCompra',
  {
    nroOrdenC: pk(),
    fechaEmision: { type: DataTypes.DATEONLY, allowNull: false },
    situacion: { type: DataTypes.STRING(20), allowNull: false, defaultValue: 'Pendiente' },
    total: { type: DataTypes.DECIMAL(12, 2), allowNull: false, defaultValue: 0 },
    codLab: { type: DataTypes.INTEGER, allowNull: false },
    nroFacturaProv: { type: DataTypes.STRING(30) },
  },
  { tableName: 'orden_compra', ...sinFechas }
);

const DetalleOrdenCompra = sequelize.define(
  'DetalleOrdenCompra',
  {
    nroOrdenC: { type: DataTypes.INTEGER, primaryKey: true },
    codMedicamento: { type: DataTypes.INTEGER, primaryKey: true },
    descripcion: { type: DataTypes.STRING(150), allowNull: false },
    cantidad: { type: DataTypes.INTEGER, allowNull: false },
    precio: { type: DataTypes.DECIMAL(10, 2), allowNull: false },
    montouni: { type: DataTypes.DECIMAL(12, 2), allowNull: false },
  },
  { tableName: 'detalle_orden_compra', ...sinFechas }
);

// Relaciones (Sequelize crea las llaves foraneas)
const restringir = { onDelete: 'RESTRICT', onUpdate: 'CASCADE' };
const cascada = { onDelete: 'CASCADE', onUpdate: 'CASCADE' };

TipoMedic.hasMany(Medicamento, { foreignKey: 'codTipoMed', as: 'medicamentos', ...restringir });
Medicamento.belongsTo(TipoMedic, { foreignKey: 'codTipoMed', as: 'tipo' });

Especialidad.hasMany(Medicamento, { foreignKey: 'codEspec', as: 'medicamentos', ...restringir });
Medicamento.belongsTo(Especialidad, { foreignKey: 'codEspec', as: 'especialidad' });

Laboratorio.hasMany(OrdenCompra, { foreignKey: 'codLab', as: 'ordenes', ...restringir });
OrdenCompra.belongsTo(Laboratorio, { foreignKey: 'codLab', as: 'laboratorio' });

OrdenVenta.hasMany(DetalleOrdenVta, { foreignKey: 'nroOrdenVta', as: 'detalles', ...cascada });
DetalleOrdenVta.belongsTo(OrdenVenta, { foreignKey: 'nroOrdenVta', as: 'orden' });
Medicamento.hasMany(DetalleOrdenVta, { foreignKey: 'codMedicamento', as: 'detallesVenta', ...restringir });
DetalleOrdenVta.belongsTo(Medicamento, { foreignKey: 'codMedicamento', as: 'medicamento' });

OrdenCompra.hasMany(DetalleOrdenCompra, { foreignKey: 'nroOrdenC', as: 'detalles', ...cascada });
DetalleOrdenCompra.belongsTo(OrdenCompra, { foreignKey: 'nroOrdenC', as: 'orden' });
Medicamento.hasMany(DetalleOrdenCompra, { foreignKey: 'codMedicamento', as: 'detallesCompra', ...restringir });
DetalleOrdenCompra.belongsTo(Medicamento, { foreignKey: 'codMedicamento', as: 'medicamento' });

// Ajusta tablas creadas por versiones anteriores del proyecto.
async function migrar() {
  const qi = sequelize.getQueryInterface();

  // usuarios: agrega la columna role si la tabla existia sin ella (el admin demo queda como administrador)
  const usuarios = await qi.describeTable('usuarios');
  if (!usuarios.role) {
    await qi.addColumn('usuarios', 'role', { type: DataTypes.ENUM(...ROLES), allowNull: false, defaultValue: 'usuario' });
    await User.update({ role: 'administrador' }, { where: { email: 'admin@farmacia.com' } });
  }

  // medicamento: agrega codEspec si la tabla existia sin esa columna
  const columnas = await qi.describeTable('medicamento');
  if (!columnas.codEspec) {
    await qi.addColumn('medicamento', 'codEspec', {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: { model: 'especialidad', key: 'codEspec' },
      onUpdate: 'CASCADE',
      onDelete: 'RESTRICT',
    });
  }
}

module.exports = {
  sequelize, migrar, ROLES,
  User, Cliente, TipoMedic, Especialidad, Laboratorio, Medicamento,
  OrdenVenta, DetalleOrdenVta, OrdenCompra, DetalleOrdenCompra,
};

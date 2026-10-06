// Configuracion de cada modulo (tabla). ver / editar / eliminar = roles con permiso.
// La usan el servidor (validacion, permisos y consultas) y el navegador (formularios, validacion en el front y tablas).

const TODOS = ['administrador', 'moderador', 'usuario'];
const EDITORES = ['administrador', 'moderador'];
const ADMIN = ['administrador'];
const SITUACIONES = ['Pendiente', 'Atendida', 'Anulada'];

const entidades = {
  // ----------------------------- ALMACEN -----------------------------
  medicamentos: {
    seccion: 'almacen', titulo: 'Medicamentos', singular: 'medicamento',
    modelo: 'Medicamento', pk: 'codMedicamento', etiqueta: 'descripcionMed', opcionExtra: { precio: 'precioVentaUni' },
    ver: TODOS, editar: EDITORES, eliminar: ADMIN,
    orden: [['codMedicamento', 'ASC']],
    include: [{ modelo: 'TipoMedic', as: 'tipo' }, { modelo: 'Especialidad', as: 'especialidad' }],
    campos: [
      { name: 'descripcionMed', label: 'Descripción', tipo: 'text', min: 3, col: 8 },
      { name: 'codTipoMed', label: 'Tipo', tipo: 'select', ref: 'tipos', col: 4 },
      { name: 'marca', label: 'Marca', tipo: 'text', min: 2, col: 4 },
      { name: 'presentacion', label: 'Presentación', tipo: 'text', min: 3, col: 4 },
      { name: 'codEspec', label: 'Especialidad', tipo: 'select', ref: 'especialidades', col: 4 },
      { name: 'fechaFabricacion', label: 'Fecha de fabricación', tipo: 'date', col: 6 },
      { name: 'fechaVencimiento', label: 'Fecha de vencimiento', tipo: 'date', despuesDe: 'fechaFabricacion', col: 6 },
      { name: 'stock', label: 'Stock', tipo: 'int', col: 4 },
      { name: 'precioVentaUni', label: 'Precio unitario (S/)', tipo: 'decimal', col: 4 },
      { name: 'precioVentaPres', label: 'Precio presentación (S/)', tipo: 'decimal', col: 4 },
    ],
    columnas: [
      { key: 'codMedicamento', label: 'Cód.' },
      { key: 'descripcionMed', label: 'Descripción' },
      { key: 'tipo.descripcion', label: 'Tipo' },
      { key: 'especialidad.descripcionEsp', label: 'Especialidad' },
      { key: 'marca', label: 'Marca' },
      { key: 'presentacion', label: 'Presentación' },
      { key: 'fechaVencimiento', label: 'Vence' },
      { key: 'stock', label: 'Stock', alinear: 'der' },
      { key: 'precioVentaUni', label: 'P. unit.', formato: 'money', alinear: 'der' },
      { key: 'precioVentaPres', label: 'P. present.', formato: 'money', alinear: 'der' },
    ],
  },

  tipos: {
    seccion: 'almacen', titulo: 'Tipos de medicamento', singular: 'tipo de medicamento',
    modelo: 'TipoMedic', pk: 'codTipoMed', etiqueta: 'descripcion',
    ver: EDITORES, editar: EDITORES, eliminar: ADMIN,
    orden: [['codTipoMed', 'ASC']],
    campos: [{ name: 'descripcion', label: 'Descripción', tipo: 'text', min: 3, col: 12 }],
    columnas: [{ key: 'codTipoMed', label: 'Cód.' }, { key: 'descripcion', label: 'Descripción' }],
  },

  especialidades: {
    seccion: 'almacen', titulo: 'Especialidades', singular: 'especialidad', femenino: true,
    modelo: 'Especialidad', pk: 'codEspec', etiqueta: 'descripcionEsp',
    ver: EDITORES, editar: EDITORES, eliminar: ADMIN,
    orden: [['codEspec', 'ASC']],
    campos: [{ name: 'descripcionEsp', label: 'Descripción', tipo: 'text', min: 3, col: 12 }],
    columnas: [{ key: 'codEspec', label: 'Cód.' }, { key: 'descripcionEsp', label: 'Descripción' }],
  },

  // ----------------------------- COMPRAS -----------------------------
  laboratorios: {
    seccion: 'compras', titulo: 'Laboratorios', singular: 'laboratorio',
    modelo: 'Laboratorio', pk: 'codLab', etiqueta: 'razonSocial',
    ver: EDITORES, editar: EDITORES, eliminar: ADMIN,
    orden: [['codLab', 'ASC']],
    campos: [
      { name: 'razonSocial', label: 'Razón social', tipo: 'text', min: 3, col: 12 },
      { name: 'direccion', label: 'Dirección', tipo: 'text', requerido: false, col: 12 },
      { name: 'telefono', label: 'Teléfono', tipo: 'tel', col: 6 },
      { name: 'email', label: 'Correo electrónico', tipo: 'email', col: 6 },
      { name: 'contacto', label: 'Contacto', tipo: 'text', requerido: false, col: 12 },
    ],
    columnas: [
      { key: 'codLab', label: 'Cód.' }, { key: 'razonSocial', label: 'Razón social' },
      { key: 'direccion', label: 'Dirección' }, { key: 'telefono', label: 'Teléfono' },
      { key: 'email', label: 'Correo' }, { key: 'contacto', label: 'Contacto' },
    ],
  },

  compras: {
    seccion: 'compras', titulo: 'Órdenes de compra', singular: 'orden de compra', femenino: true,
    modelo: 'OrdenCompra', pk: 'nroOrdenC', etiqueta: 'nroOrdenC',
    ver: EDITORES, editar: EDITORES, eliminar: ADMIN,
    orden: [['nroOrdenC', 'DESC']],
    include: [{ modelo: 'Laboratorio', as: 'laboratorio' }, { modelo: 'DetalleOrdenCompra', as: 'detalles' }],
    totalCampo: 'total',
    campos: [
      { name: 'fechaEmision', label: 'Fecha de emisión', tipo: 'date', col: 6 },
      { name: 'codLab', label: 'Laboratorio', tipo: 'select', ref: 'laboratorios', col: 6 },
      { name: 'situacion', label: 'Situación', tipo: 'select', opciones: SITUACIONES, col: 6 },
      { name: 'nroFacturaProv', label: 'N° factura del proveedor', tipo: 'text', requerido: false, max: 30, col: 6 },
    ],
    columnas: [
      { key: 'nroOrdenC', label: 'N° orden' }, { key: 'fechaEmision', label: 'Fecha' },
      { key: 'laboratorio.razonSocial', label: 'Laboratorio' }, { key: 'situacion', label: 'Situación' },
      { key: 'nroFacturaProv', label: 'Factura' }, { key: 'detalles.length', label: 'Ítems', alinear: 'der' },
      { key: 'total', label: 'Total', formato: 'money', alinear: 'der' },
    ],
    detalle: {
      modelo: 'DetalleOrdenCompra', fkOrden: 'nroOrdenC', descCampo: 'descripcion',
      // El precio NO se digita: se toma del medicamento (Almacen) y monto = cantidad x precio
      monto: { campo: 'montouni', cantidad: 'cantidad', precio: 'precio', precioDe: 'precioVentaUni' },
      campos: [
        { name: 'codMedicamento', label: 'Medicamento', tipo: 'select', ref: 'medicamentos', col: 8 },
        { name: 'cantidad', label: 'Cantidad (unidades)', tipo: 'int', valorMin: 1, col: 4 },
      ],
      columnas: [
        { key: 'codMedicamento', label: 'Cód.' }, { key: 'descripcion', label: 'Medicamento' },
        { key: 'cantidad', label: 'Cant.', alinear: 'der' }, { key: 'precio', label: 'Precio', formato: 'money', alinear: 'der' },
        { key: 'montouni', label: 'Monto', formato: 'money', alinear: 'der' },
      ],
    },
  },

  // ----------------------------- VENTAS -----------------------------
  clientes: {
    seccion: 'ventas', titulo: 'Clientes', singular: 'cliente',
    modelo: 'Cliente', pk: 'codCliente', etiqueta: 'nombre',
    ver: TODOS, editar: EDITORES, eliminar: ADMIN,
    orden: [['codCliente', 'ASC']],
    campos: [
      { name: 'nombre', label: 'Nombre', tipo: 'text', min: 2, col: 6 },
      { name: 'apellidos', label: 'Apellidos', tipo: 'text', min: 2, col: 6 },
      { name: 'direccion', label: 'Dirección', tipo: 'text', min: 3, col: 12 },
    ],
    columnas: [
      { key: 'codCliente', label: 'Cód.' }, { key: 'nombre', label: 'Nombre' },
      { key: 'apellidos', label: 'Apellidos' }, { key: 'direccion', label: 'Dirección' },
    ],
  },

  ventas: {
    seccion: 'ventas', titulo: 'Órdenes de venta', singular: 'orden de venta', femenino: true,
    modelo: 'OrdenVenta', pk: 'nroOrdenVta', etiqueta: 'nroOrdenVta',
    ver: TODOS, editar: EDITORES, eliminar: ADMIN,
    orden: [['nroOrdenVta', 'DESC']],
    include: [{ modelo: 'DetalleOrdenVta', as: 'detalles' }],
    campos: [
      { name: 'fechaEmision', label: 'Fecha de emisión', tipo: 'date', col: 6 },
      { name: 'situacion', label: 'Situación', tipo: 'select', opciones: SITUACIONES, col: 6 },
      { name: 'motivo', label: 'Motivo', tipo: 'text', min: 3, col: 12 },
    ],
    columnas: [
      { key: 'nroOrdenVta', label: 'N° orden' }, { key: 'fechaEmision', label: 'Fecha' },
      { key: 'motivo', label: 'Motivo' }, { key: 'situacion', label: 'Situación' },
      { key: 'detalles.length', label: 'Ítems', alinear: 'der' },
    ],
    detalle: {
      modelo: 'DetalleOrdenVta', fkOrden: 'nroOrdenVta', descCampo: 'descripcionMed',
      campos: [
        { name: 'codMedicamento', label: 'Medicamento', tipo: 'select', ref: 'medicamentos', col: 8 },
        { name: 'cantidadRequerida', label: 'Cantidad', tipo: 'int', valorMin: 1, col: 4 },
      ],
      columnas: [
        { key: 'codMedicamento', label: 'Cód.' }, { key: 'descripcionMed', label: 'Medicamento' },
        { key: 'cantidadRequerida', label: 'Cantidad', alinear: 'der' },
      ],
    },
  },
};

// Secciones de la barra de navegacion (Ventas / Compras / Almacen)
const secciones = [
  { clave: 'ventas', titulo: 'Ventas' },
  { clave: 'compras', titulo: 'Compras' },
  { clave: 'almacen', titulo: 'Almacén' },
];

module.exports = { entidades, secciones };

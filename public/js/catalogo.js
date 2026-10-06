// Pagina generica de tabla + CRUD (medicamentos, tipos, especialidades, laboratorios, compras, ventas)
// Los formularios y la validacion se generan a partir de la configuracion que envia el servidor.

const { cfg, opciones, puede } = JSON.parse(document.getElementById('datos').textContent);
const API = '/api/' + cfg.ruta;

// ---------- utilidades ----------
function el(tag, clase, texto) {
    const e = document.createElement(tag);
    if (clase) e.className = clase;
    if (texto !== undefined) e.textContent = texto;
    return e;
}

function obtener(obj, ruta) {
    return ruta.split('.').reduce((o, k) => (o == null ? o : o[k]), obj);
}

function formatear(v, formato) {
    if (v === null || v === undefined || v === '') return '-';
    return formato === 'money' ? 'S/ ' + Number(v).toFixed(2) : String(v);
}

// Crea el control de un campo (input / select) con su etiqueta y mensaje de error
function crearCampo(c, prefijo) {
    const col = el('div', 'col-md-' + (c.col || 6));
    const etiqueta = el('label', 'form-label', c.label);
    let control;
    if (c.tipo === 'select') {
        control = el('select', 'form-select');
        control.append(new Option('Selecciona…', ''));
        const lista = c.ref ? opciones[c.ref] : c.opciones.map((o) => ({ value: o, label: o }));
        lista.forEach((o) => control.append(new Option(o.label, o.value)));
    } else {
        control = el('input', 'form-control');
        control.type = { text: 'text', email: 'email', tel: 'tel', date: 'date', int: 'number', decimal: 'number' }[c.tipo];
        if (c.tipo === 'int') { control.min = c.valorMin ?? 0; control.step = 1; }
        if (c.tipo === 'decimal') { control.min = c.valorMin ?? 0; control.step = 0.01; }
    }
    control.name = c.name;
    control.id = prefijo + c.name;
    etiqueta.htmlFor = control.id;
    col.append(etiqueta, control, el('div', 'invalid-feedback'));
    return col;
}

// Convierte la configuracion de campos en reglas de validacion del front-end
function reglasDe(campos) {
    const reglas = {};
    for (const c of campos) {
        const lista = [];
        const opcional = c.requerido === false;
        const solo = (fn) => (v, f) => (opcional && v.trim() === '' ? true : fn(v, f));
        if (!opcional) lista.push(c.tipo === 'select' ? Reglas.seleccion : Reglas.requerido);
        if (['text'].includes(c.tipo) && c.min) lista.push(solo(Reglas.minimo(c.min)));
        if (c.tipo === 'email') lista.push(solo(Reglas.email));
        if (c.tipo === 'tel') lista.push(solo(Reglas.telefono));
        if (c.tipo === 'int') lista.push(solo(Reglas.enteroMin(c.valorMin ?? 0)));
        if (c.tipo === 'decimal') lista.push(solo(Reglas.decimalMin(c.valorMin ?? 0)));
        if (c.despuesDe) {
            const origen = campos.find((x) => x.name === c.despuesDe);
            lista.push(solo(Reglas.despuesDe(c.despuesDe, origen.label)));
        }
        reglas[c.name] = lista;
    }
    return reglas;
}

function limpiarMarcas(form) {
    form.querySelectorAll('.is-valid, .is-invalid').forEach((i) => i.classList.remove('is-valid', 'is-invalid'));
}

function valoresDe(form, campos) {
    return Object.fromEntries(campos.map((c) => [c.name, form.elements[c.name].value]));
}

// ---------- buscador ----------
document.getElementById('buscar').addEventListener('input', (e) => {
    const q = e.target.value.toLowerCase();
    document.querySelectorAll('#tabla tbody tr').forEach((tr) => {
        tr.hidden = q !== '' && !tr.textContent.toLowerCase().includes(q);
    });
});

// ---------- crear / editar ----------
const formMain = document.getElementById('formMain');
const modalForm = new bootstrap.Modal(document.getElementById('modalForm'));
let editandoId = null;

cfg.campos.forEach((c) => document.getElementById('camposMain').append(crearCampo(c, 'f_')));
const reglasMain = reglasDe(cfg.campos);
validacionEnVivo(formMain, reglasMain);

function abrirForm(fila) {
    formMain.reset();
    limpiarMarcas(formMain);
    mostrarAlerta('');
    editandoId = fila ? fila[cfg.pk] : null;
    document.getElementById('tituloModal').textContent = (fila ? 'Editar ' : (cfg.femenino ? 'Nueva ' : 'Nuevo ')) + cfg.singular;
    if (fila) cfg.campos.forEach((c) => { formMain.elements[c.name].value = fila[c.name] ?? ''; });
    modalForm.show();
}

const btnNuevo = document.getElementById('btnNuevo');
if (btnNuevo) btnNuevo.addEventListener('click', () => abrirForm(null));
document.querySelectorAll('.btn-edit').forEach((b) => b.addEventListener('click', () => abrirForm(JSON.parse(b.dataset.json))));

formMain.addEventListener('submit', async (e) => {
    e.preventDefault();
    mostrarAlerta('');
    if (!validarFormulario(formMain, reglasMain)) return;
    const datos = valoresDe(formMain, cfg.campos);
    try {
        await (editandoId ? api(`${API}/${editandoId}`, 'PUT', datos) : api(API, 'POST', datos));
        window.location.reload();
    } catch (err) {
        mostrarAlerta(err.message);
    }
});

// ---------- eliminar ----------
document.querySelectorAll('.btn-del').forEach((b) =>
    b.addEventListener('click', async () => {
        if (!confirm(`¿Eliminar "${b.dataset.nombre}"?`)) return;
        try {
            await api(`${API}/${b.dataset.id}`, 'DELETE');
            window.location.reload();
        } catch (err) {
            toast(err.message, 'danger');
        }
    }));

// ---------- detalle de la orden (ventas / compras) ----------
if (cfg.detalle) {
    const d = cfg.detalle;
    const modalDetalle = new bootstrap.Modal(document.getElementById('modalDetalle'));
    const cuerpo = document.getElementById('cuerpoDetalle');
    const formDetalle = document.getElementById('formDetalle');
    let ordenActual = null;
    let huboCambios = false;

    async function cargarDetalle() {
        const lineas = await api(`${API}/${ordenActual}/detalle`);
        cuerpo.replaceChildren();
        let total = 0;
        lineas.forEach((l) => {
            const tr = el('tr');
            d.columnas.forEach((c) => {
                tr.append(el('td', c.alinear === 'der' ? 'text-end' : '', formatear(obtener(l, c.key), c.formato)));
            });
            if (d.monto) total += Number(l[d.monto.campo]);
            if (puede.editar) {
                const td = el('td', 'text-end');
                const btn = el('button', 'btn btn-sm btn-outline-danger');
                btn.type = 'button';
                btn.title = 'Quitar';
                btn.append(el('i', 'bi bi-x-lg'));
                btn.addEventListener('click', async () => {
                    try {
                        await api(`${API}/${ordenActual}/detalle/${l.codMedicamento}`, 'DELETE');
                        huboCambios = true;
                        await cargarDetalle();
                    } catch (err) {
                        mostrarAlerta(err.message, 'alertaDetalle');
                    }
                });
                td.append(btn);
                tr.append(td);
            }
            cuerpo.append(tr);
        });
        if (!lineas.length) {
            const tr = el('tr');
            const td = el('td', 'text-center text-muted py-3', 'Esta orden aún no tiene medicamentos.');
            td.colSpan = d.columnas.length + (puede.editar ? 1 : 0);
            tr.append(td);
            cuerpo.append(tr);
        }
        const totalEl = document.getElementById('totalDetalle');
        if (totalEl) totalEl.textContent = 'S/ ' + total.toFixed(2);
    }

    document.querySelectorAll('.btn-detalle').forEach((b) =>
        b.addEventListener('click', async () => {
            ordenActual = b.dataset.id;
            huboCambios = false;
            document.getElementById('tituloDetalle').textContent = `Detalle de la ${cfg.singular} N° ${ordenActual}`;
            if (formDetalle) {
                formDetalle.reset();
                limpiarMarcas(formDetalle);
                mostrarAlerta('', 'alertaDetalle');
            }
            try {
                await cargarDetalle();
                modalDetalle.show();
            } catch (err) {
                toast(err.message, 'danger');
            }
        }));

    // Al cerrar el detalle se recarga la tabla para actualizar items y totales
    document.getElementById('modalDetalle').addEventListener('hidden.bs.modal', () => {
        if (huboCambios) window.location.reload();
    });

    if (formDetalle) {
        d.campos.forEach((c) => document.getElementById('camposDetalle').append(crearCampo(c, 'd_')));
        const reglasDetalle = reglasDe(d.campos);
        validacionEnVivo(formDetalle, reglasDetalle);

        // Vista previa: precio unitario (de Almacen) y subtotal
        const info = document.getElementById('infoPrecio');
        if (info && d.monto) {
            const actualizarInfo = () => {
                const op = opciones.medicamentos.find((o) => String(o.value) === formDetalle.elements.codMedicamento.value);
                const cant = Number(formDetalle.elements.cantidad.value);
                if (!op) { info.textContent = 'Elige un medicamento: su precio unitario se toma automáticamente de Almacén.'; return; }
                const precio = Number(op.precio);
                info.textContent = 'Precio unitario (Almacén): S/ ' + precio.toFixed(2) +
                    (cant > 0 ? '  ·  Subtotal: S/ ' + (precio * cant).toFixed(2) : '');
            };
            formDetalle.elements.codMedicamento.addEventListener('change', actualizarInfo);
            formDetalle.elements.cantidad.addEventListener('input', actualizarInfo);
            formDetalle.addEventListener('reset', () => setTimeout(actualizarInfo));
        }

        formDetalle.addEventListener('submit', async (e) => {
            e.preventDefault();
            mostrarAlerta('', 'alertaDetalle');
            if (!validarFormulario(formDetalle, reglasDetalle)) return;
            try {
                await api(`${API}/${ordenActual}/detalle`, 'POST', valoresDe(formDetalle, d.campos));
                huboCambios = true;
                formDetalle.reset();
                limpiarMarcas(formDetalle);
                await cargarDetalle();
            } catch (err) {
                mostrarAlerta(err.message, 'alertaDetalle');
            }
        });
    }
}

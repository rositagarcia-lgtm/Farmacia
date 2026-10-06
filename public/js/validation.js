// Validacion de formularios en el front-end (antes de enviar al back-end)

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// Cada regla devuelve true si es valida, o un texto con el error.
const Reglas = {
    requerido: (v, msg) => v.trim() !== '' || (typeof msg === 'string' ? msg : 'Este campo es obligatorio.'),
    minimo: (n) => (v) => v.trim().length >= n || `Debe tener al menos ${n} caracteres.`,
    email: (v) => EMAIL_RE.test(v.trim()) || 'Ingresa un correo válido (ej. nombre@correo.com).',
    password: (v) =>
        (v.length >= 8 && /[A-Za-z]/.test(v) && /\d/.test(v)) || 'Mínimo 8 caracteres, con letras y números.',
    seleccion: (v) => v !== '' || 'Selecciona una opción.',
    telefono: (v) => /^[0-9+\-\s()]{6,20}$/.test(v.trim()) || 'Teléfono inválido (solo números, 6 a 20 dígitos).',
    enteroMin: (n) => (v) => (v !== '' && Number.isInteger(Number(v)) && Number(v) >= n) || `Ingresa un entero mayor o igual a ${n}.`,
    decimalMin: (n) => (v) => (v !== '' && Number.isFinite(Number(v)) && Number(v) >= n) || `Ingresa un monto mayor o igual a ${n}.`,
    despuesDe: (otro, etiqueta) => (v, form) => !form.elements[otro].value || v > form.elements[otro].value || `Debe ser posterior a ${etiqueta.toLowerCase()}.`,
};

function marcarCampo(input, error) {
    const ok = error === true;
    input.classList.toggle('is-invalid', !ok);
    input.classList.toggle('is-valid', ok);
    const fb = input.parentElement.querySelector('.invalid-feedback');
    if (fb) fb.textContent = ok ? '' : error;
    return ok;
}

// reglas: { nombreCampo: [fn1, fn2, ...] }. Devuelve true si todo el formulario es valido.
function validarFormulario(form, reglas) {
    let todoOk = true;
    for (const [nombre, lista] of Object.entries(reglas)) {
        const input = form.elements[nombre];
        let resultado = true;
        for (const regla of lista) {
            resultado = regla(input.value, form);
            if (resultado !== true) break;
        }
        if (!marcarCampo(input, resultado)) todoOk = false;
    }
    return todoOk;
}

// Valida cada campo mientras el usuario escribe (despues del primer intento)
function validacionEnVivo(form, reglas) {
    for (const nombre of Object.keys(reglas)) {
        const input = form.elements[nombre];
        const revisar = () => {
            let r = true;
            for (const regla of reglas[nombre]) { r = regla(input.value, form); if (r !== true) break; }
            marcarCampo(input, r);
        };
        input.addEventListener('blur', revisar);
        input.addEventListener('input', () => { if (input.classList.contains('is-invalid')) revisar(); });
    }
}

function mostrarAlerta(texto, id = 'alerta') {
    const a = document.getElementById(id);
    if (!a) return;
    a.textContent = texto;
    a.classList.toggle('d-none', !texto);
}

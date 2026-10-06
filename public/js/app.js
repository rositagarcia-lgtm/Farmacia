// Utilidades compartidas por todas las paginas

// Llama a la API (el JWT viaja en la cookie httpOnly). Lanza Error con el mensaje del servidor.
async function api(url, metodo = 'GET', cuerpo) {
    const opciones = { method: metodo, headers: {} };
    if (cuerpo !== undefined) {
        opciones.headers['Content-Type'] = 'application/json';
        opciones.body = JSON.stringify(cuerpo);
    }
    const res = await fetch(url, opciones);
    let datos = {};
    try { datos = await res.json(); } catch (e) { /* respuesta sin cuerpo */ }
    if (!res.ok) {
        if (res.status === 401) { window.location.href = '/login'; }
        throw new Error(datos.error || 'Ocurrió un error inesperado.');
    }
    return datos;
}

// Notificacion tipo toast (Bootstrap)
function toast(texto, tipo = 'success') {
    const el = document.getElementById('toastMsg');
    if (!el) return;
    el.className = 'toast align-items-center border-0 text-bg-' + tipo;
    document.getElementById('toastTexto').textContent = texto;
    bootstrap.Toast.getOrCreateInstance(el, { delay: 3000 }).show();
}

// Cerrar sesion
const btnLogout = document.getElementById('btnLogout');
if (btnLogout) {
    btnLogout.addEventListener('click', async () => {
        try { await api('/api/auth/logout', 'POST'); } finally { window.location.href = '/login'; }
    });
}

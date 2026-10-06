// Gestion de usuarios (solo administrador)

document.querySelectorAll('.sel-rol').forEach((sel) => {
    sel.dataset.anterior = sel.value;
    sel.addEventListener('change', async () => {
        try {
            await api(`/api/usuarios/${sel.dataset.id}/rol`, 'PUT', { role: sel.value });
            sel.dataset.anterior = sel.value;
            toast('Rol actualizado');
        } catch (err) {
            sel.value = sel.dataset.anterior;
            toast(err.message, 'danger');
        }
    });
});

document.querySelectorAll('.btn-del').forEach((b) =>
    b.addEventListener('click', async () => {
        if (!confirm(`¿Eliminar al usuario "${b.dataset.nombre}"?`)) return;
        try {
            await api('/api/usuarios/' + b.dataset.id, 'DELETE');
            window.location.reload();
        } catch (err) {
            toast(err.message, 'danger');
        }
    }));

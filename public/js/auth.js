// Login y registro: validacion en el front-end y envio a la API

const formLogin = document.getElementById('formLogin');
const formRegister = document.getElementById('formRegister');

if (formLogin) {
    const reglas = {
        email: [Reglas.requerido, Reglas.email],
        password: [(v) => Reglas.requerido(v, 'Ingresa tu contraseña.')],
    };
    validacionEnVivo(formLogin, reglas);

    formLogin.addEventListener('submit', async (e) => {
        e.preventDefault();
        mostrarAlerta('');
        if (!validarFormulario(formLogin, reglas)) return;

        const btn = document.getElementById('btnEnviar');
        btn.disabled = true;
        try {
            await api('/api/auth/login', 'POST', {
                email: formLogin.email.value.trim(),
                password: formLogin.password.value,
            });
            window.location.href = '/menu';
        } catch (err) {
            mostrarAlerta(err.message);
            btn.disabled = false;
        }
    });
}

if (formRegister) {
    const reglas = {
        nombre: [Reglas.requerido, Reglas.minimo(3)],
        email: [Reglas.requerido, Reglas.email],
        password: [Reglas.requerido, Reglas.password],
        password2: [
            Reglas.requerido,
            (v, form) => v === form.elements.password.value || 'Las contraseñas no coinciden.',
        ],
    };
    validacionEnVivo(formRegister, reglas);

    formRegister.addEventListener('submit', async (e) => {
        e.preventDefault();
        mostrarAlerta('');
        if (!validarFormulario(formRegister, reglas)) return;

        const btn = document.getElementById('btnEnviar');
        btn.disabled = true;
        try {
            await api('/api/auth/register', 'POST', {
                nombre: formRegister.nombre.value.trim(),
                email: formRegister.email.value.trim(),
                password: formRegister.password.value,
            });
            window.location.href = '/menu';
        } catch (err) {
            mostrarAlerta(err.message);
            btn.disabled = false;
        }
    });
}

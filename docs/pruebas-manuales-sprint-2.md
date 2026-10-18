# Prueba manual del frontend — Sprint 2

Para quien pruebe: marca cada casilla, anota la fecha y tu nombre, y adjunta una captura por HU como evidencia (DoD, CodeFactory 9.1). Si algo falla, anota qué viste y qué esperabas.

## Preparación

1. En `frontend/`: copiar `.env.example` a `.env` y activar `VITE_MODO_SIMULADO=true`.
2. `npm install` (la primera vez) y `npm run dev`. Abrir `http://localhost:5173`.
3. Cualquier contraseña sirve. El rol sale del correo:
   - `ana@correo.com` → usuario (ya tiene una cita de ejemplo)
   - `especialista@vitalis.com` → especialista (Carlos Ramírez, tiene 3 horarios)
   - `admin@vitalis.com` → administrador
4. **Recargar la página (F5) reinicia los datos simulados** (la sesión se conserva). Para ver un flujo completo, navega con los enlaces del menú, sin recargar.

Probar al menos en Chrome y en otro navegador (Edge o Firefox), y una vez en el celular o con el ancho de ventana reducido (375 px).

## Usuario (`ana@correo.com`)

- [ ] **HU-12** Menú → Solicitar cita → elegir Cardiología → elegir un horario → el resumen se llena → Confirmar. Aparece "¡Cita solicitada!" con especialidad, fecha y hora.
- [ ] **HU-12** Pulsar "Confirmar cita" sin elegir horario: explica qué falta. El horario ya reservado no vuelve a ofrecerse.
- [ ] **HU-10** Disponibilidad → Cardiología → se ven horarios por fecha. Filtrar una fecha lejana: "No hay horarios disponibles para esa fecha". Una fecha pasada: muestra error. Dermatología: sin horarios.
- [ ] **HU-13** Mis citas: se ve la cita de ejemplo con su detalle y estado.
- [ ] **HU-15** Reprogramar → elegir otro horario → Confirmar: aparece "¡Cita reprogramada!" y en Mis citas el estado es "Reprogramada".
- [ ] **HU-14** Cancelar cita → "Mantener cita" no cambia nada. Esc cierra el diálogo. "Sí, cancelar cita" cancela y confirma. Una cita cancelada ya no ofrece Reprogramar ni Cancelar.
- [ ] **HU-03** Mi perfil: se ven los datos. Vaciar el nombre o poner un teléfono con letras muestra errores. Guardar cambia el saludo de la cabecera ("Hola, …"). "Cancelar" descarta los cambios.
- [ ] **HU-24** Escribir en la barra de direcciones `/registrar-especialista`, `/gestion-agenda` y `/horarios`: "No tienes acceso a esta página".
- [ ] **HU-26** Cerrar sesión lleva al login. Con el botón "atrás" del navegador no se ve ninguna cita.

## Especialista (`especialista@vitalis.com`)

- [ ] **HU-09** Mi agenda: se ven los horarios con su estado. Agregar uno válido lo muestra en la tabla. Probar: fin antes de inicio, fecha pasada y un horario que se cruce con otro (debe avisar y no crearlo).
- [ ] **HU-11** Gestión de agenda: el horario reservado dice "Con cita reservada" y no tiene botón. Bloquear pide confirmación y queda "Bloqueado". Liberar lo deja "Disponible".
- [ ] **HU-07** Editar especialidades: solo aparece Cardiología. Vaciar el nombre muestra error. Cambiar la duración muestra el aviso sobre citas ya programadas. Guardar confirma.
- [ ] **HU-03** Mi perfil funciona igual que para el usuario.
- [ ] **HU-24** Probar `/mis-citas`, `/solicitar-cita` y `/registrar-especialista`: acceso restringido.

## Administrador (`admin@vitalis.com`)

- [ ] **HU-04** Registrar especialista: el envío vacío marca los obligatorios. Correo o teléfono inválidos muestran error. Un registro válido confirma. Repetir el mismo correo avisa que ya está registrado.
- [ ] **HU-24** Probar `/mis-citas`, `/horarios` y `/gestion-agenda`: acceso restringido.

## Seguridad y registro (sin sesión)

- [ ] **HU-25** Registro (`/registro`): sin marcar la casilla de autorización de datos no se envía, y el foco va a la casilla.
- [ ] **HU-25** Inactividad: con una sesión abierta, dejar 30 minutos sin tocar nada → vuelve al login con el aviso "Cerramos tu sesión por inactividad". (Para no esperar, probar con el reloj del sistema o pedir que se reduzca `MINUTOS_INACTIVIDAD` solo para la prueba.)
- [ ] **HU-23** El aviso de cuenta bloqueada solo se puede ver con el backend real (responde 423 o 429 tras 5 intentos).

## Accesibilidad (revisar a mano lo que una herramienta no ve)

- [ ] Recorrer cada pantalla solo con el teclado (Tab, Shift+Tab, Enter, Esc): todo es alcanzable, el foco siempre se ve y el orden tiene sentido.
- [ ] En los diálogos, el foco queda dentro, Esc cierra y el foco vuelve al botón que lo abrió.
- [ ] Con un lector de pantalla (NVDA en Windows, o VoiceOver): los errores se anuncian, el estado de los botones de opción se lee ("pulsado"), y las tablas se leen con sus encabezados.
- [ ] Ampliar el zoom al 200 % y a 400 %: no se corta ni se pierde contenido.
- [ ] Los textos de error y de aviso se entienden: dicen qué pasó y cómo seguir.

## Con el backend real (cuando exista)

Repetir las pruebas anteriores con `VITE_MODO_SIMULADO` apagado y comprobar además: que la cookie de sesión sea `HttpOnly` (en las herramientas del navegador, Application → Cookies), que `sessionStorage` no contenga nada de la sesión, que recargar con sesión abierta no pida iniciar sesión otra vez, y que un usuario no pueda ver ni cancelar la cita de otro cambiando el id en la dirección.

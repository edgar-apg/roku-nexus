# Roku Nexus

## Versión para sitio público

La carpeta `docs/` contiene un prototipo estático que puede publicarse con GitHub Pages. Cada visitante abre la dirección HTTPS y el navegador intenta mandar botones directamente a su Roku por la red local; el servidor público no recibe la IP de la TV ni las órdenes del control.

La página detecta el idioma preferido del navegador (español o inglés) y ofrece un selector manual. Incluye el favicon SVG compartido por el usuario, una guía de preparación, una explicación previa al permiso de red local, recuperación si el permiso está bloqueado e ingreso manual de IP.

La interfaz usa verde como color de acentuación. Para probar el permiso de red local desde un navegador, sirve la página desde HTTPS; abrir el archivo HTML directamente no reproduce ese flujo.

El botón **Buscar Roku en mi red** hace una búsqueda web de mejor esfuerzo: la persona indica los primeros tres bloques de una IP local y el navegador revisa los 254 equipos de ese rango en el puerto ECP 8060. El navegador no puede ejecutar directamente el descubrimiento multicast SSDP que usa la versión Python. Después prueba leer el nombre amigable o modelo mediante `/query/device-info`; si la Roku permite CORS para esa página, muestra el nombre reportado. Si no, muestra un nombre genérico junto a la IP. Los resultados son posibles dispositivos que respondieron en ese puerto; el usuario elige uno y decide si enviar Inicio. La búsqueda ocurre en el navegador del visitante; el sitio publicado no recibe esas direcciones.

**Prototipo, aún no validado en navegadores ni listo para publicar:** la Roku no garantiza permiso CORS, así que la página no puede garantizar que recupere nombres, confirme la conexión o lea las aplicaciones. Después de Conectar, pide comprobar visualmente si Roku volvió a Inicio. La búsqueda por rango es lenta y puede listar otros servicios HTTP en el puerto 8060. El envío directo de comandos depende del permiso de red local, de HTTPS y de las políticas del navegador. Se debe probar con los navegadores y dispositivos que quieras admitir antes de anunciarlo como compatible. La guía de Chrome explica que leer respuestas entre orígenes requiere los encabezados CORS correspondientes.

Para publicar manualmente en GitHub Pages:

1. Sube el contenido de esta carpeta a un repositorio público de GitHub.
2. En el repositorio abre **Settings → Pages**.
3. En **Build and deployment**, elige **Deploy from a branch**, la rama que subiste y la carpeta **/docs**; guarda.
4. GitHub mostrará la dirección cuando termine la publicación.

GitHub Pages gratuito requiere que el repositorio sea público. Publicar el sitio permite que cualquiera lo visite, pero cada persona solo podrá controlar su propia Roku en su red local si su navegador lo permite. No he subido el repositorio ni publicado la página.

## Versión local para Windows

La versión Python descrita abajo sirve la interfaz desde tu PC y puede ser abierta en un celular conectado a la misma red. Usa Python estándar, sin paquetes ni servicios de pago.

## Requisitos

- Windows 10/11 con Python 3.10 o posterior instalado y disponible como `py` o `python`.
- PC y Roku en la misma red doméstica; para usar el celular, también debe estar conectado a esa red.
- En Roku, revisa **Configuración > Sistema > Configuración avanzada del sistema > Control por aplicaciones móviles / Acceso a la red** y permite el control según las opciones disponibles en tu versión. Roku OS 14.1 y posteriores requieren habilitar el control por red para recibir los botones ECP.

## Inicio

1. Haz doble clic en `INICIAR.bat`.
2. La primera vez, Windows puede preguntar si Python puede comunicarse en redes privadas. Permítelo solo para tu red privada/doméstica si quieres usar el celular.
3. En la misma PC abre `http://127.0.0.1:8000`.
4. En el celular conectado a la misma Wi-Fi abre la dirección `http://...:8000` que muestra la ventana de Python.
5. Ingresa en cada navegador la contraseña temporal que aparece en esa ventana.
6. Escribe la IP de la Roku (Configuración > Red > Acerca de) y pulsa **Conectar**. También puedes probar **Buscar**; si el router bloquea SSDP, el ingreso manual sigue disponible.

Deja abierta la ventana de Python mientras usas el control. Cierra esa ventana para detener el servidor. La contraseña cambia en cada inicio.

## Controles y compatibilidad

La navegación, Inicio, Atrás y reproducción usan comandos ECP. La lista de aplicaciones se consulta a Roku y permite abrirlas. Volumen y encendido aparecen si el dispositivo se identifica como Roku TV o informa compatibilidad. La disponibilidad real depende del modelo, del televisor conectado y de su configuración. Un Streaming Stick puede controlar lo que expone su Roku, pero no garantiza controles de volumen/encendido de cualquier televisor HDMI.

## Seguridad y red

- El servidor escucha en la red local para que el celular pueda abrir la página. La contraseña se genera al iniciar y la sesión caduca tras 12 horas.
- Roku ECP usa HTTP sin cifrado. Usa una red Wi-Fi doméstica protegida, no compartas la contraseña y detén el programa cuando termines.
- No abras puertos en el router ni publiques el servidor en Internet. No uses una red Wi-Fi pública.
- La lista de IP/nombres se conserva en el almacenamiento local del navegador; la contraseña no se guarda en la página.
- Si Windows Firewall bloquea el acceso, permite Python en redes privadas. Asegúrate también de que el router no tenga aislamiento de clientes o red de invitados.

## Configuración opcional

La contraseña temporal se puede sustituir antes de iniciar definiendo la variable `ROKU_REMOTE_PASSWORD` en la consola. No uses una contraseña de otras cuentas. Para detener el programa, presiona Ctrl+C o cierra la ventana.

## Teclado y botones

La página pública incluye un botón de teclado que abre un diálogo. Cada carácter que se escribe o borra se transmite al campo de texto activo en Roku; usa los comandos Lit_ y Backspace de ECP. El campo de Roku debe estar abierto y aceptar entrada de texto; no equivale a un teclado virtual universal para todas las apps. Los botones principales siguen la distribución del control de referencia (Atrás y Home arriba, flechas con OK al centro, repetición y asterisco debajo, y reproducción al final). Solo muestran símbolos, con nombres accesibles para lectores de pantalla. El botón de asterisco/opciones usa el comando Info reconocido por Roku ECP.


El diálogo también tiene el botón **Entrar**, que envía la tecla Enter de ECP después de terminar los caracteres pendientes.


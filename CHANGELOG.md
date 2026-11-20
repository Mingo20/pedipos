# Historial de cambios · PediPOS

Todas las versiones notables de este proyecto. El formato sigue [Keep a Changelog](https://keepachangelog.com/es-ES/1.1.0/) y el versionado es [SemVer](https://semver.org/lang/es/).

## [1.8.0] - 2026-11-20

### Corregido
- **Primera tarjeta tapada en Catalogo y Pedidos.** El margen negativo que añadi en 1.7.1 montaba la barra de busqueda sobre la primera tarjeta (tapaba 12 y 14 px en un movil de 360 px). Ahora la barra sube sin invadir: solape 0 px.

### Cambiado
- **Talonario:** Producto mas ancho (88 a 117 px en movil); Cantidad y Precio corridos a la derecha. Columnas con `minmax(0, ...)` para que el texto de la cabecera no las encoja.
- **Modal Venta registrada:** oculto el icono de documento junto a Imprimir.
- **Manos libres:** deslizar el microfono a la derecha ya no desliza el talonario; solo activa la grabacion. La barra flota sobre la rejilla y el talonario se queda en su sitio.
- **Dock movil:** iconos de 21 a 26 px, texto de 9,6 a 11 px y celdas sin separacion extra.
- **Respaldo en Drive** pasa de Emisores a Configuracion, con todos sus botones.

### Eliminado
- La pantalla **Emisores** (barra PC, menu movil y enrutador): la sustituye la interfaz administrativa `admin.html`.

## [1.7.0] - 2026-11-19

### Añadido
- **Interfaz administrativa** (`admin.html`): gestión de comercios con tarjetas, buscador, filtros, detalle en panel lateral (PC) o hoja deslizante (móvil), seis interruptores por comercio (bloquear, e-CF, voz, respaldo, notificaciones, soporte), notas internas, mapa con Leaflet por provincia/municipio, importar y exportar JSON. Registro local en IndexedDB con datos de demostración.
- **Modo manos libres en PC**: al deslizar el micrófono a la derecha, la barra de grabación sale del talonario y flota sobre la rejilla de productos, con tiempo en vivo, ver, pausar, cancelar y enviar; el talonario se retira para dejar explorar el catálogo. Al enviar, se abre la ventana Cobrar.
- Acceso a la administración desde Configuración.

### Corregido
- El hueco entre el encabezado y el buscador de Pedidos y Catálogo era la barra de instalación, que ocupaba 59 px de alto. Ahora flota sobre el contenido y el hueco baja de 73 px a 14 px.

## [1.6.0] - 2026-11-19

### Corregido
- **El teclado del telefono se cerraba solo.** El redibujado por cambio de tamano se disparaba al abrirse el teclado (cambia el alto, no el ancho) y destruia el campo. Ahora solo se redibuja si cambia el ancho y nunca mientras se escribe. Verificado: antes el foco y el texto se perdian, ahora se conservan.
- **Los pagos se borraban solos.** La sincronizacion reemplazaba el cliente desde la nube cada 30 s y se llevaba los abonos. Ahora los pagos se unen por identificador, la nube no puede borrarlos y el estado de pago de las ventas no se revierte.
- El archivo tenia dos funciones llamadas `registrarPago`: la de proveedores anulaba la de clientes. Renombrada a `registrarPagoCliente`.

### Añadido
- `js/cuentas.js`: los pagos viven en su propio almacen IndexedDB, con migracion de los que estaban dentro del cliente.
- Tarjeta de pago con fecha, monto, nota y saldo despues del abono.
- Modo flash: al dictar una venta por voz, la ventana Cobrar se abre sola con el boton Confirmar cobro.
- Boton "Pagar todo" en el abono.

### Cambiado
- Un solo sonido para toda la app: tocar un producto suena igual que tocar un icono de navegacion.

## [1.5.0] - 2026-11-19

### Cambiado
- **Las ventas pasan a IndexedDB** (`js/ventas.js`). El almacen viejo solo guarda productos, clientes, ajustes y carrito. Se acabo el borrado de historial cuando el telefono se llenaba: la app ya no recorta ventas para hacer espacio.
- Migracion automatica al arrancar: las ventas que estaban en el almacen viejo se copian a IndexedDB, se unen sin duplicar si habia de los dos lados y despues se reescribe el almacen viejo sin ventas.
- Escritura agrupada cada 700 ms y volcado al salir de la pagina, para no escribir en cada toque.

### Corregido
- El aviso de espacio lleno decia que se habia liberado historial antiguo; ahora informa el estado real.

## [1.4.0] - 2026-11-19

### Añadido
- **Respaldo en el Drive del comerciante** (`js/respaldo.js`): cada comprobante se sube a su propio Drive, en PediPOS Comprobantes / año / mes, con permiso `drive.file`. Se verifica leyendo de vuelta el archivo, se escribe un `indice.json` del mes con total, ultimo e-NCF y huella SHA-256, y hay restauracion desde Drive.
- **Estado del respaldo en el panel de Emisores**: conectado como, respaldados, pendientes, ultimo respaldo y avisos cuando algo queda solo en el equipo.
- **El interruptor ITBIS manda sobre la factura electronica**: encendido activa la emision y la factura sale sola al cobrar; apagado la desactiva y la venta sigue como informal. Chip "e-CF" junto al ITBIS y linea de estado en el recibo.

### Cambiado
- La etiqueta del boton Imprimir en "Ticket del pedido" ahora es blanca, igual que su icono.

## [1.3.1] - 2026-11-19

### Corregido
- Las conexiones de IndexedDB quedaban abiertas para siempre: comprobantes y cola de sincronizacion. Ahora se sueltan al salir de la pagina, al pedir otra pestana una version nueva y con `PPComprobantes.cerrar()`. Probado: tras cerrar, una apertura con version superior sube sin bloqueo.

## [1.3.0] - 2026-11-18

### Añadido
- **Comprobantes en IndexedDB** (`js/comprobantes.js`): los XML firmados salen de localStorage, que se llenaba a las pocas horas con volumen alto. Espejo en memoria, migración automática de lo viejo y liberación del espacio.
- **Exportación** de comprobantes en JSON (con datos del emisor) y CSV desde la tarjeta de Comprobantes.
- **Panel de emisores** (`js/emisores.js`, pantalla nueva en las dos barras): avisa de certificado vencido, secuencia vencida, rechazos y comprobantes en cola. Importa el archivo exportado por cada comerciante.
- **Un solo emisor por secuencia**: cada equipo tiene identidad propia; si la secuencia pertenece a otro equipo, la emisión se bloquea con aviso y hay un botón para liberarla.

### Corregido
- Los abonos del cliente no descontaban la deuda: solo restaban cuando se saldaba una venta completa. Ahora la deuda es total a crédito menos pagos, el abono se reparte en las ventas y la tarjeta aparece en el historial de pagos.
- El abono avisa si el teléfono no tiene espacio en vez de fallar en silencio.
- Sombra gris bajo las tarjetas de kpis en Clientes y Proveedores, que se veía sobre la primera tarjeta de la lista.

### Cambiado
- Analítica: sin título ni subtítulo, pastillas de periodo centradas, ancho un poco mayor, fuera las tarjetas "Ticket promedio" y "Artículos". Las tarjetas de gráfico ya no se desbordan en el teléfono y el eje de fechas se rotula cada N días.

## [1.2.1] - 2026-11-18

### Añadido
- Arquitectura confirmada **todo en el navegador**: cada comerciante firma y envía con su propio certificado desde su computadora, sin servidores intermedios.
- **Cola de contingencia** en Fiscal: si se cae la red, el comprobante queda en cola con estado propio, se reintenta solo al volver la conexión y hay un botón para reintentar los pendientes.
- Analítica muestra **datos de ejemplo** cuando aún no hay ventas reales, con etiqueta visible, para que el panel se entienda desde el primer día.

### Corregido
- Barra de navegación del teléfono centrada para cualquier número de iconos (quedaba corrida a la izquierda tras quitar Fiscal).
- Encabezado de Fiscal en el verde de la marca también en modo demostración (antes salía ámbar).
- Botón "Guardar configuración" en blanco con borde verde, acorde a la paleta.
- Margen de 16 px entre el encabezado y las tarjetas Comprado/Pagado y Comprado/Debe en los detalles de cliente y proveedor.

## [1.2.0] - 2026-11-18

### Añadido
- **Analítica rediseñada**: selector de periodo (Hoy, 7 días, 30 días, Todo), seis KPIs dinámicos (ventas, tickets, ticket promedio, ITBIS, artículos, crédito), gráfico de área de ventas por día, dona de métodos de pago, ranking de productos, horas con más movimiento, mejores clientes y últimos movimientos. Rejilla horizontal de 3 columnas en PC y vertical en el teléfono. Nuevos archivos `js/analitica.js` y `css/analitica.css`.

### Corregido
- Panel de venta: 12 px de margen entre la barra de búsqueda y el icono de filtro, y el desplegable de categorías queda anclado a la barra.
- Panel de venta en PC: la lista de productos agregados muestra 5 filas de un vistazo, sin tener que deslizar.
- El icono Fiscal salió de la barra inferior del teléfono y ahora vive en el menú lateral del encabezado, como el resto de pantallas.

### Cambiado
- Encabezado de la pantalla Fiscal en verde, siguiendo la estética del sistema.

## [1.1.1] - 2026-11-18

### Corregido
- La pestaña **Fiscal** no cabía en la barra inferior del teléfono: la barra pasa de 5 a 6 iconos y el texto se ajusta para que quepa.
- En PC, el encabezado del talonario quedaba tapado por la barra superior. Ahora la tarjeta arranca 14 px debajo del encabezado.
- La rejilla de productos mostraba 7 columnas en pantallas grandes; ahora muestra 6, tanto en Catálogo como en el panel de venta.

## [1.0.0] · 2026-11-17

- Versión publicada con voz, offline y sincronización

# Historial de cambios · PediPOS

Todas las versiones notables de este proyecto. El formato sigue [Keep a Changelog](https://keepachangelog.com/es-ES/1.1.0/) y el versionado es [SemVer](https://semver.org/lang/es/).

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

# Historial de cambios · PediPOS

Todas las versiones notables de este proyecto. El formato sigue [Keep a Changelog](https://keepachangelog.com/es-ES/1.1.0/) y el versionado es [SemVer](https://semver.org/lang/es/).

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

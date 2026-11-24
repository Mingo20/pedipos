## 2.15.0 (v126)
- Panel de venta movil vertical: el catalogo deja de ser barra lateral y pasa a ser una hoja inferior que se arrastra hacia arriba y hacia abajo con el dedo. Siempre queda a la vista su encabezado y la fila de categorias (con desplazamiento lateral), sin botones para reabrir y sin desvanecimientos.
- Al expandir la hoja aparece una barra inferior fija con el buscador "Buscar producto.." y el microfono de pedido por voz.
- El talonario sube hasta el encabezado (se elimino el espacio muerto) y la barra NUEVA/COBRAR/microfono se apoya justo encima de la hoja.
- Venta por voz estilo nota de voz: mantener pulsado el microfono para dictar y soltar para procesar; deslizar hacia arriba durante la grabacion la deja en manos libres (con eliminar, onda, tiempo, pausar y enviar); deslizar a la izquierda cancela. Indicadores de grabacion, duracion, bloqueo y cancelacion en una barra unica.
- Catalogo base dominicano: 42 productos de colmado (Granos, Despensa, Lacteos, Carnes, Embutido, Viveres, Panaderia, Snacks, Bebidas y Limpieza) con precio en RD$, unidad y foto descargada de Wikimedia Commons. Se siembra una sola vez por equipo y sube a la base central con la cola de sincronizacion existente. Creditos en img/productos/CREDITOS.md.
- Nuevo `js/catalogo-dr.js` (datos y siembra) y `img/productos/` (42 fotos recortadas a 420x420).
- Sin cambios en el procesamiento de pedidos, el talonario, la sincronizacion ni la facturacion electronica: solo interfaz, disposicion, gestos y la experiencia de voz.

## 2.14.0 (v125)
- Reparto de numeros e-NCF sin perdidas: servicio propio `pediposSecuencia` (copia en backend/). Probado con 2 a 8 cajas a la vez: sin duplicados ni numeros perdidos.
- La emision ahora SI usa el bloque reservado (antes preguntaba por una funcion inexistente y caia al contador local).
- Sin numeros y sin red: no se emite, la venta sigue como ticket normal y el e-NCF no cambia.
- Corregido un candado que podia dejar a una caja sin pedir mas numeros; un bloque nuevo ya no se pierde si aun quedan numeros.
- Certificado digital restaurable: se cifra en el equipo (AES-256-GCM), con consentimiento y frase; se restaura en un equipo limpio y se verifica que firma.
- Talonario: la etiqueta del switch ahora dice "e-CF", aparece solo con el switch encendido y se actualiza en tiempo real.

## 2.16.0 (v127)
- Catalogo del panel: el buscador pasa a ser un campo "Lista de pedido" de varias lineas donde se escribe o se pega la lista completa. Crece hacia arriba solo, con el doble de alto inicial, y la lupa se cambio por el icono de lista.
- Mientras el campo tiene contenido el microfono se convierte en enviar: al pulsarlo se interpreta la lista, los productos entran al talonario y la hoja del catalogo se contrae sola. La lista puede venir en varias lineas, con vinetas o numerada.
- El interprete local de pedidos ahora separa por saltos de linea, punto y coma, vinetas y numeros de lista (antes solo por comas y "y"), para que pegar una lista funcione igual que dictarla.
- Tarjetas del catalogo: el producto elegido se resalta, lleva un circulo con la cantidad en la esquina y sube al principio de la rejilla. Si la cantidad vuelve a cero, el resalte y el circulo desaparecen.
- Barra de grabacion reordenada y alineada: zafacon en el extremo izquierdo (cancela), candado en el extremo derecho con flecha que indica subir hacia el, y el microfono abajo a la derecha alineado con el candado. El arrastre corre el microfono hacia arriba y a la derecha, hacia el candado.
- Al empezar a grabar se cierra el teclado y la hoja del catalogo se aparta, para que la barra quede sola y sin amontonarse. En manos libres la hoja vuelve y la barra sube sobre el campo.
- Talonario: fuera los iconos de lista de pedido y carrito, fuera el microfono de la barra de cobro, y el boton (+) pasa al centro exacto entre NUEVA y COBRAR.
- Catalogo base dominicano ampliado de 42 a 72 productos: 30 nuevos de colmado en Granos, Despensa, Enlatados, Lacteos, Embutido, Carnes, Viveres, Panaderia, Snacks, Bebidas, Limpieza e Higiene. Sin duplicados con los existentes.
- Sin cambios en el procesamiento de pedidos, el inventario, la sincronizacion ni la facturacion electronica.

## 2.17.0 (v128)
- Catalogo del panel: animaciones suaves al cambiar de categoria y al aparecer las tarjetas (entrada escalonada, respeta "reducir movimiento").
- Campo de la lista: fuera el icono de lista, etiqueta corta "Lista de pedido", el texto arranca pegado abajo y crece hacia arriba con las lineas.
- Lupa en la esquina inferior izquierda: abre un buscador horizontal pequeno para filtrar productos por nombre sin perder la lista escrita.
- Borrador junto al microfono: vacia la lista de un solo toque.
- La hoja del catalogo se queda a la vista mientras se graba, y en manos libres se puede recorrer el catalogo con la grabacion activa. La barra de voz se apoya encima del campo, sin tapar nada.
- Al procesar un pedido por voz o por lista de texto, los productos entran al talonario y la hoja se contrae sola.
- Fuera las etiquetas de gesto de la barra de voz. El candado sube y se agranda, el zafacon se agranda; ambos con animacion propia (el arco del candado se abre y se cierra, la tapa del zafacon se levanta y se cierra).
- Confirmacion al empezar a grabar: vibracion marcada y aviso sonoro fuerte de dos tonos.
- Fotografias: 50 fotos nuevas de Wikimedia Commons (420x420) para los 30 productos que estaban sin imagen y para los 20 nuevos, mas las de los 8 productos base. El catalogo queda con 92 productos, todos con foto. Creditos en img/productos/CREDITOS.md.
- Los equipos que ya habian sembrado el catalogo reciben la foto que les faltaba al abrir la app (completarFotos), sin duplicar productos.
- 20 productos nuevos de colmado dominicano: Yautia, Name, Guineo, Lechuga, Remolacha, Pimiento Verde, Apio, Bacalao, Longaniza, Yogurt, Crema de Leche, Sopa en Sobre, Vinagre, Salsa Picante, Gelatina, Cereal de Maiz, Jugo en Polvo, Bebida Energizante, Papel Toalla y Pasta Dental.
- Sin cambios en el procesamiento de pedidos, el inventario, el talonario ni la facturacion electronica.

# Historial de cambios · PediPOS

Todas las versiones notables de este proyecto. El formato sigue [Keep a Changelog](https://keepachangelog.com/es-ES/1.1.0/) y el versionado es [SemVer](https://semver.org/lang/es/).

## [2.17.0] - 2026-11-24

### Anadido
- **Buscador con lupa** en el catalogo del panel: campo horizontal pequeno que filtra por nombre sin borrar la lista escrita.
- **Borrador** junto al microfono para vaciar la lista de un toque.
- **Fotografias** para los 50 productos que no tenian (30 anteriores + 20 nuevos) y para los 8 productos base; el catalogo queda en 92 productos, todos con foto.
- **20 productos nuevos** de colmado dominicano con precio, unidad, categoria y foto.
- **Confirmacion de grabacion**: vibracion y aviso sonoro fuerte al empezar a grabar.
- **Animaciones**: entrada escalonada de las tarjetas al filtrar o abrir, arco del candado y tapa del zafacon animados.

### Cambiado
- **Campo de la lista**: sin icono, etiqueta "Lista de pedido", el texto arranca abajo y crece hacia arriba.
- **Barra de voz**: candado mas grande y mas alto, zafacon mas grande, sin etiquetas de gesto.
- **Grabacion**: la hoja del catalogo se queda a la vista y se puede recorrer mientras se dicta; al procesar, la hoja se contrae sola.
- Los equipos con el catalogo ya sembrado reciben las fotos que faltaban sin duplicar productos.

## [2.16.0] - 2026-11-24

### Anadido
- **Lista de pedido en el catalogo**: campo de varias lineas para escribir o pegar el pedido completo; al enviar se interpreta y los productos entran al talonario.
- **30 productos nuevos** de colmado dominicano (Granos, Despensa, Enlatados, Lacteos, Embutido, Carnes, Viveres, Panaderia, Snacks, Bebidas, Limpieza e Higiene). El catalogo base queda en 72.

### Cambiado
- **Tarjetas del catalogo**: el producto elegido se resalta, muestra la cantidad en un circulo y sube al principio de la rejilla.
- **Barra de grabacion**: zafacon a la izquierda, candado a la derecha con flecha de gesto, microfono alineado con el candado y sin solapes con el teclado ni con la hoja del catalogo.
- **Barra de cobro**: el boton (+) queda al centro entre NUEVA y COBRAR; se retiraron los iconos de lista de pedido, carrito y microfono del talonario.
- El interprete local separa pedidos por saltos de linea, punto y coma, vinetas y numeros de lista.

## [2.15.0] - 2026-11-24

### Anadido
- **Hoja inferior del catalogo** en el Panel de venta movil: arrastrable, con encabezado y categorias siempre visibles, buscador y microfono fijos al expandir.
- **Venta por voz estilo nota de voz**: mantener para grabar y enviar, deslizar arriba para manos libres, deslizar a la izquierda para cancelar, con tiempo, pausa y envio manual.
- **Catalogo base dominicano**: 42 productos de colmado con foto, categoria, unidad y precio (`js/catalogo-dr.js`, `img/productos/`).

### Cambiado
- El icono del carrito del talonario ya no abre una pantalla aparte: expande la hoja del catalogo.
- El talonario se pega al encabezado y la barra de accion se coloca encima de la hoja.

## [2.13.1] - 2026-11-23

### Anadido
- **Nube y perfil** en Configuracion: activar la reserva de bloques e-NCF en el servidor y restaurar el perfil en un equipo nuevo con RNC, usuario y PIN.
- **`js/nubeperfil.js`**: consume los bloques reservados, pide 50 numeros cuando quedan menos de 5 y verifica el PIN con PBKDF2-SHA256 antes de aplicar los ajustes y los usuarios. Si no hay red o no esta activo, el contador sigue local.

### Cambiado
- El chip del talonario dice **FISCAR** en lugar de e-CF.

## [2.13.0] - 2026-11-23

### Anadido
- **Backend `pedposPerfil`** (funcion Deno en Base44): reserva atomica de bloques de e-NCF por RNC y tipo, y perfil restaurable del comercio. Entidades nuevas: `SecuenciaECF` y `PerfilComercio`.
- **Reserva de secuencia en la nube**: cada caja pide un bloque de 50 numeros y los consume en local. Probado con reservas simultaneas: 1-10 y 11-20, sin solaparse.
- **Modulo `js/nube.js`**: bloques de secuencia, perfil (usuarios con PIN en PBKDF2-SHA256, ajustes y `.p12` cifrado con AES-GCM) y restauracion en equipo nuevo.
- El contador de e-NCF consulta primero el bloque del servidor y cae al contador local si no hay bloque o no hay red, sin bloquear la venta.

### Seguridad
- El servidor nunca recibe el PIN ni la clave del certificado: solo el hash y el `.p12` cifrado con llave derivada del PIN en el dispositivo.

## [2.8.2] - 2026-11-22

### Corregido
- **Pantalla en blanco al iniciar sesion**: la guarda de arranque de la 2.8.1 se ejecutaba antes de declarar su estado y rompia el primer dibujo. Ahora usa variables izadas, se inicializa en la primera llamada y nunca descarta un dibujo si la vista esta vacia.
- **Analitica**: la fila de KPIs recupera el comportamiento responsivo y deslizable (desliza en movil, rejilla centrada en PC) y las 7 tarjetas quedan visibles.

### Anadido
- **Suplidores**: nueva tarjeta de KPI "Del mes" con el monto comprado en el mes actual.
- **Sonido del sistema**: un solo listener global hace sonar el tock del sistema en cualquier boton, tarjeta, icono o acceso, con filtro de 70 ms para no duplicar el sonido cuando el boton ya lo emite.

### Cambiado
- **Detalle del suplidor**: la tarjeta "Debe" pasa a llamarse "Le debe".

## [2.8.1] - 2026-11-22

### Corregido
- **Analitica**: la fila de KPIs vuelve a mostrar las siete tarjetas completas, incluidas Ventas e ITBIS, en PC y en movil. Se quitaron los recortes (`overflow`, `white-space:nowrap`) que dejaban cifras fuera de la tarjeta y se fijo una rejilla de dos columnas en movil.
- **Arranque estable**: durante el primer segundo y medio la app descarta los redibujos repetidos con el mismo estado, que eran los que hacian "pestanear" la pantalla al abrir una seccion.

### Anadido
- **Notificaciones**: barra inferior con buscador por nombre de cliente y filtro por estado (vencidas, por vencer).
- **Detalle del cliente**: las fechas de pago se muestran como 20/11/2026 a las 2:58 p. m. y la etiqueta paso a "Saldo pendiente:".

### Cambiado
- El boton flotante (+) baja un poco mas en Clientes, Suplidores e Inventario.
- **Soporte**: el boton dice "Escribir WhatsApp" y se ocultaron los datos de contacto y el horario.
- **Configuracion**: las subpantallas se abren sin el encabezado principal ni la barra inferior, la cabecera pierde el fondo blanco y el boton de volver queda en la esquina izquierda.
- Cache del service worker a `pedipos-v113`.

## [2.8.0] - 2026-11-22

### Añadido
- **Clientes**: la fila de KPIs suma total de clientes y clientes con credito por vencer (proximos 7 dias); en movil la fila se desliza de lado a lado.
- **Detalle del cliente**: nuevas tarjetas Este mes y Debe; la fila de KPIs tambien se desliza en movil.
- **Suplidores**: nueva tarjeta con el total de suplidores y fila de KPIs deslizable en movil.
- **Detalle del suplidor**: tarjetas de compra del mes y compras a credito del mes; campo Fecha de pago (vencimiento) en Nueva compra, guardado en la compra.
- **Aviso de pago a suplidor**: notificacion un dia antes y el dia limite de cada compra a credito con vencimiento.
- **Analitica**: dos KPIs nuevos (ticket promedio y clientes atendidos), contenido centrado y tarjetas un poco mas anchas.

### Cambiado
- El boton Deuda pasa a llamarse Estado cuenta y la ventana modal Estado de deuda pasa a Estado de cuenta; el boton se oculta cuando el cliente esta al dia.
- Cambiar entre Ventas y Pagos (y entre Compras y Pagos) ya no repinta la pantalla: solo cambia la lista con una transicion suave.
- La cabecera del detalle de cliente y de suplidor pierde el fondo blanco; nombre y direccion a la izquierda y WhatsApp a la derecha.
- El boton de filtro queda pegado a la esquina derecha en clientes y suplidores.
- En PC, el talonario del panel de venta sube hasta la esquina interior: se quito el margen superior sobrante.
- Cache del service worker a `pedipos-v113`.

## [2.7.0] - 2026-11-21

### Añadido
- **Configuracion en tarjetas**: la pantalla de Ajustes pasa a ser un menu de modulos (Mi negocio, Caja y acceso, Uso de IA, Sincronizacion y Administracion). Cada tarjeta abre su subpantalla con boton de volver, en vez de una sola pagina larga.
- **Modulo Uso de IA**: lee el consumo real del mes con `puter.auth.getMonthlyUsage()` (gastado, saldo del permiso y desglose por servicio en dolares), permite conectar la cuenta de Puter desde la app y trae un boton directo al panel de consumo de Puter.
- **Administracion solo para el administrador**: el respaldo en Drive se movio aqui; un cajero con sesion no ve la tarjeta. Se aclara en pantalla por que el respaldo vive en la app y no en `admin.html` (usa el Drive del comerciante, no el del operador).

### Cambiado
- La tarjeta superior de cliente y de suplidor ocupa todo el ancho de la pantalla en PC, tableta y telefono.
- En movil las tarjetas y los botones ganan ancho (margen lateral de 10 px en vez de 14).
- El boton flotante (+) baja 24 px en inventario, clientes y suplidores; la bolsa flotante y su aviso se reacomodan.
- Cache del service worker a `pedipos-v112`.

## [2.2.0] - 2026-11-21

### Añadido
- **Certificacion como emisor** (`js/certificacion.js`): 14 revisiones automaticas antes de pedir nada (RNC con digito verificador, razon social, direccion, provincia y municipio, telefono, correo, ambiente, formato y rango del e-NCF, vencimiento, certificado, clave), prueba real contra certecf con firma y envio, descarga de evidencias y estado guardado.
- **Portal de la DGII dentro de la app**: se intenta embeber la Oficina Virtual; si la DGII bloquea el marco, aparece el aviso y el boton de ventana segura sin salir del flujo, con "Ya lo hice" que marca el paso.
- Pantalla en la barra lateral de PC y en el menu del telefono, y acceso desde Fiscal.

### Cambiado
- Lista de revisiones compacta: primero lo pendiente y lo que ya esta en orden plegado.

## [2.1.0] - 2026-11-21

### Añadido
- **Pantalla Rechazos** (`js/rechazos.js`): cada comprobante rechazado con el motivo de la DGII, que paso, que hacer y el boton Corregir y reenviar. DeepSeek (Puter) redacta la explicacion con el catalogo como contexto y cache local por motivo; si Puter no esta, responde el catalogo. Reenvio individual con correccion del comprador, que reconstruye el XML desde la venta.
- `PPFiscal.reenviar(id, cambios)` y reenvio de un solo comprobante.
- Icono `alert` y entrada Rechazos en la barra de PC y en el menu movil.

### Cambiado
- **Formulario fiscal en tarjetas**: datos del emisor (RNC, telefono, razon social, nombre comercial, correo), ubicacion (provincia, municipio, direccion), comprobante y secuencia (ambiente, tipo, proximo e-NCF, ultimo autorizado, vencimiento, sucursal) y certificado. Se guardan los campos nuevos y el municipio se repuebla al cambiar la provincia.
- Pulido premium: transiciones suaves en botones y campos, foco con halo verde, entrada de pantallas y respeto a `prefers-reduced-motion`.

### Corregido
- `VERSION` de index.html estaba en 95 mientras version.json iba en 99: la app se recargaba sola a los 4 segundos. Ahora index.html, version.json y sw.js van juntos en 99.

## [2.0.0] - 2026-11-20

### Añadido
- **Avisos del negocio** (`js/avisos.js`): cobros vencidos y por vencer, comprobantes rechazados por la DGII, secuencia e-NCF y certificado por vencer, mas de 24 h sin respaldar y consejo semanal. Se revisan al abrir, al volver a la app y cada minuto. Boton en Configuracion para autorizar y probar. Al tocar el aviso abre la pantalla que corresponde.
- `notificationclick` en el service worker y apertura por `?ir=`.

### Cambiado
- Encabezado del talonario: 10 px de aire entre CANTIDAD y PRECIO, sin mover los campos.
- Icono de carrito en la barra de productos del panel y titulo "Catalogo" en esa barra.
- Pantalla Catalogo pasa a **Inventario**; Proveedores pasa a **Suplidores** (barra, menu y titulos).
- Botones "Editar cliente" y "Editar suplidor" con icono.
- Barra de venta en grabacion: blanco puro, sin tono gris ni degradado.
- Tarjetas de analitica: etiqueta arriba, monto debajo y detalle en una linea, sin desbordes.

### Eliminado
- La ventana Cobrar ya no se abre sola al enviar un pedido por voz.

## [1.9.0] - 2026-11-20

### Añadido
- **Editor de item desde el talonario:** al tocar el nombre se abre "Editar item" con nombre, cantidad, precio, costo, unidad y categoría; si viene del catálogo, se actualiza también allí.
- **Filtro en tiempo real** al crear un item manual: al escribir se despliegan tarjetas de los productos que coinciden y se agregan con un toque; si el texto coincide exacto (sin importar mayúsculas ni acentos) se agrega solo.
- **Campo Costo** en crear y editar item, para calcular ganancias.
- **Analítica:** KPIs de Ganancias (venta menos costo) e Inventario (stock por costo); las tarjetas van en fila deslizable y los montos bajan a 18 px.
- **Recibos imprimibles** en el pago del cliente, la compra y el pago del proveedor, con icono de impresora junto a "Enviar comprobante".
- **Onboarding:** la categoría del negocio pasa a lista desplegable e incluye servicios (centros de belleza, barberías, tatuajes, consultorios, otros).

### Cambiado
- Etiqueta CANTIDAD separada de PRECIO en el talonario (solo la etiqueta; los campos no se mueven).
- Manos libres: al enviar se oculta la barra de productos y se abre COBRAR.
- "Enviar por WhatsApp" pasa a "Enviar comprobante" en los tres comprobantes.
- Todos los buscadores dicen solo "Buscar". PRODUCTO pasa a ITEM en la interfaz.

### Corregido
- Error al confirmar el item manual cuando la fila desaparecía (lectura de un campo ya eliminado).
- Analítica tolera ventas antiguas sin detalle de líneas.

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

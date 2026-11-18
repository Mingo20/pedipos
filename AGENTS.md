# AGENTS.md · PediPOS

Guía para agentes de IA y para personas que necesiten modificar este proyecto. Léela completa antes de tocar el código.

## Contexto

- **Organización:** DGTech (República Dominicana). Fundador: Domingo Guerra.
- **Proyecto:** PediPOS · versión actual **1.0.0** · estado **Producción**.
- **Repositorio:** `Mingo20/pedipos`
- **Aplicación en vivo:** https://mingo20.github.io/pedipos/
- **Hub del ecosistema:** https://mingo20.github.io/dtech/
- **Idioma de la interfaz y de las respuestas:** español dominicano.

## Qué resuelve

Los pequeños comercios dominicanos pierden ventas cuando se cae el internet y pierden tiempo anotando pedidos a mano.

## Resumen técnico

**Tipo:** PWA offline + backend Base44

Todo se guarda primero en el dispositivo. La capa js/sync.js empuja y recibe cambios de la función pedposSync cuando hay red.

**Stack**

- JavaScript modular sin frameworks (store, sync, voice, ticket, onboarding)
- Service Worker para uso sin conexión
- IA de voz y pedidos vía Puter.js
- Backend: función pedposSync en Base44
- Almacenamiento local en el teléfono

**Backend**

- pedposSync (sincronización con la base central)

**Datos**

- Productos, ventas y clientes (base central Base44)

## Reglas que no se pueden romper

- ITBIS fijo de 18 %
- Debe poder vender con el modo avión activado
- La venta por voz no debe bloquear la venta manual

## Datos sensibles

Datos comerciales del negocio: inventario, ventas y clientes.

## Cómo trabajar aquí

1. Lee el README y este archivo. Luego abre el código que vayas a cambiar.
2. Haz el cambio más pequeño que resuelva el problema. No reescribas lo que funciona.
3. Prueba en el navegador antes de dar algo por terminado: abre la aplicación, recorre el flujo afectado y revisa la consola.
4. Si la app tiene Service Worker, **sube el número de la caché** al cambiar archivos, o los usuarios seguirán viendo la versión vieja.
5. Registra cada cambio en `CHANGELOG.md` con la versión, la fecha y una línea clara.
6. Sube la versión según la regla: *mayor* si rompes algo, *menor* si añades una función, *parche* si corriges un error.

## Reglas de seguridad

- **Nunca** escribas contraseñas, tokens, claves de API ni PIN en el código, en los README ni en los mensajes de commit. Este repositorio es público.
- Las claves van como secretos del backend. En el navegador solo puede haber datos públicos.
- Si encuentras una credencial expuesta, avisa al dueño y recomienda rotarla antes de seguir.
- No borres datos de producción sin confirmación explícita del dueño.

## Pendientes conocidos

- Documentar el esquema de sincronización y el manejo de conflictos

## Estilo

- Textos para el usuario en español dominicano, claros y cordiales.
- Horas en formato de 12 horas (9:45 p. m.). Fechas con el mes en letras.
- Diseño limpio, rápido y pensado primero para el celular.

## Contacto

Domingo Guerra · DGTech · WhatsApp 829-646-9885

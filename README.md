<div align="center">

<img src="https://raw.githubusercontent.com/Mingo20/dtech/main/assets/brand/dg-logo-512.png" width="84" alt="DGTech" />

# PediPOS

**Punto de venta para colmados, mini markets y almacenes. Funciona sin internet, vende por voz y calcula el ITBIS 18 %.**

![Versión](https://img.shields.io/badge/versión-1.0.0-FF6A13?style=flat-square) ![Estado](https://img.shields.io/badge/estado-Producción-2EA44F?style=flat-square) ![Tipo](https://img.shields.io/badge/tipo-PWA_offline_%2B_backend_Base44-0B2545?style=flat-square) ![DGTech](https://img.shields.io/badge/by-DGTech-FF6A13?style=flat-square)

[**Abrir la aplicación**](https://mingo20.github.io/pedipos/) · [Hub DGTech](https://mingo20.github.io/dtech/) · [Guía para agentes](AGENTS.md) · [Cambios](CHANGELOG.md)

<img src="https://raw.githubusercontent.com/Mingo20/dtech/main/assets/shots/pedipos.jpg" alt="PediPOS" width="720" />

</div>

## El problema

Los pequeños comercios dominicanos pierden ventas cuando se cae el internet y pierden tiempo anotando pedidos a mano.

## Qué hace

- Talonario con ITBIS 18 %, búsqueda de productos y lista de pedido
- Venta por voz con IA
- Catálogo, historial, analítica y soporte
- Avisos de pago y mensajes dentro de la app
- Impresión de ticket y sonidos de confirmación
- Funciona sin red y sincroniza solo cuando vuelve la conexión

## Cómo está construido

**Tipo:** PWA offline + backend Base44

Todo se guarda primero en el dispositivo. La capa js/sync.js empuja y recibe cambios de la función pedposSync cuando hay red.

**Tecnologías**

- JavaScript modular sin frameworks (store, sync, voice, ticket, onboarding)
- Service Worker para uso sin conexión
- IA de voz y pedidos vía Puter.js
- Backend: función pedposSync en Base44
- Almacenamiento local en el teléfono

**Backend**

- pedposSync (sincronización con la base central)

**Datos**

- Productos, ventas y clientes (base central Base44)

## Datos sensibles

Datos comerciales del negocio: inventario, ventas y clientes.

## Reglas del proyecto

- ITBIS fijo de 18 %
- Debe poder vender con el modo avión activado
- La venta por voz no debe bloquear la venta manual

## Pendientes conocidos

- Documentar el esquema de sincronización y el manejo de conflictos

## Estructura del repositorio

Consulta [AGENTS.md](AGENTS.md) para el mapa de archivos y las instrucciones de trabajo.

## Parte de DGTech

Este proyecto forma parte del ecosistema **DGTech**, un estudio de software dominicano que construye aplicaciones instalables para resolver problemas reales. Todas las aplicaciones están en [https://mingo20.github.io/dtech/](https://mingo20.github.io/dtech/).

---

<sub>© 2026 DGTech · Domingo Guerra · Todos los derechos reservados. Consulta el archivo NOTICE.</sub>

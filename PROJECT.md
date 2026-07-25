# PROJECT

## Objetivo

Desarrollar una aplicación Full Stack Desktop First basada en Electron para la gestión inteligente de correos electrónicos mediante Inteligencia Artificial Local (LLM).

La aplicación deberá permitir conectar múltiples proveedores de correo (Gmail, Outlook, IMAP, etc.), analizar automáticamente los correos, clasificarlos, resumirlos, detectar eventos importantes, generar tareas y administrar el conocimiento del usuario de forma privada utilizando modelos ejecutados localmente.

El proyecto debe diseñarse desde el inicio para permitir una futura versión Web reutilizando el mayor porcentaje posible del código.

---

# Filosofía

Desktop First.

La arquitectura nunca deberá depender de Electron.

Electron será únicamente el contenedor de la aplicación.

Todo el Core del sistema deberá poder reutilizarse posteriormente desde una aplicación Web.

---

# Arquitectura General

Frontend
- SAPUI5
- MVC
- Component.js
- Routing
- Models
- Services

Backend
- Node.js
- Express
- Arquitectura Hexagonal + Shared Kernel

Persistencia
- SQLite (Desktop)
- Arquitectura preparada para múltiples proveedores.

IA
- Modelo Local embebido.
- Arquitectura desacoplada mediante AI Provider.

Integraciones
- Gmail
- Outlook
- IMAP
- Sistema de archivos

---

# Objetivos de Calidad

- Alta mantenibilidad
- Alta cohesión
- Bajo acoplamiento
- Código limpio
- Arquitectura desacoplada
- Cobertura de pruebas
- Seguridad por defecto
- Documentación viva

---

# Restricciones

Nunca sacrificar arquitectura por velocidad.

Nunca generar código temporal.

Nunca introducir deuda técnica intencional.

Siempre preferir escalabilidad antes que soluciones rápidas.

Todo cambio importante deberá quedar documentado.
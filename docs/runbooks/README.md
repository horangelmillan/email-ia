# Runbooks operativos — Email IA

> Procedimientos operativos para `v0.4.0` (`main` + `develop` sincronizados). Cada runbook sigue ARCHITECTURE_DECISIONS §3.8: objetivo, requisitos previos, procedimiento paso a paso, validación y recuperación.

| #   | Runbook                                  | Archivo                    | Cuándo usar                                |
| --- | ---------------------------------------- | -------------------------- | ------------------------------------------ |
| 1   | Instalación local                        | `01-instalacion.md`        | Setup inicial, onboarding, CI local        |
| 2   | Migraciones de BD                        | `02-migraciones.md`        | Cambios de esquema Drizzle + libSQL        |
| 3   | Gestión de modelos IA                    | `03-gestion-modelos-ia.md` | Descarga, listado y eliminación de modelos |
| 4   | Sincronización incremental offline-first | `04-sync-incremental.md`   | `EmailSyncService` + `pageToken` loop      |
| 5   | Recuperación y copias de seguridad       | `05-recuperacion.md`       | Backup, restore, fallo de BD/clave         |

Referencias: `PROJECT_STATE.md:151`, `ARCHITECTURE_DECISIONS.md:3.8`, `ADR-002` (stack), `ADR-004` (BD + `SecretStorePort` + cifrado), `ADR-005` (runtime IA + `ModelManagerPort`), `ADR-006` (UI5 + Electron), `ADR-009` (Pino/OTel/health).

Reevaluar Loki/Tempo/SaaS solo si hay destino de despliegue (ADR-009, PROJECT_STATE #Riesgos).

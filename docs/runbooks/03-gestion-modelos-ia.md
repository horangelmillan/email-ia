# Runbook 03 — Gestión de modelos IA

## Objetivo

Operar el gestor de modelos (`ModelManagerPort` en `packages/core/src/ports/model-manager.port.ts:6`) y los adaptadores multi-runtime (`packages/ai-provider`) sin tocar lógica de dominio.

## Requisitos previos

- Puerto `ModelManagerPort`: `listLocalModels()`/`pullModel(name, onProgress?)`/`removeModel(name)`/`getModelPath(name)` (`ADR-005`).
- Adaptadores: `FilesystemModelManager` (`filesystem-model-manager.ts:34`, DI `fs`/`fetch`/`path`), `OllamaProvider` (`POST /api/pull` NDJSON, timeout 300 s, normaliza `/v1`→`/api`), `LlamafileRuntime` (`binaryPath`/`modelPath`/`host`/`port`, DI `spawn`/`fetch`/`fs`).
- Factory `createAIProvider({provider, baseUrl, llamafile}, fetchImpl, {llamafileRuntime})` con defaults `ollama:11434`/`lmstudio:1234`/`llamafile:8080` (`packages/ai-provider/src/factory.ts`).

## Procedimiento

1. Listar modelos locales:
   ```ts
   import { FilesystemModelManager } from '@email-ia/ai-provider';
   const mgr = new FilesystemModelManager({ modelsDir: './models' });
   const list = await mgr.listLocalModels(); // [{id, path, sizeBytes}]
   ```
2. Descargar (pull) — dos caminos:
   - **Ollama** (recomendado para GGUF/hf sin URL):
     ```ts
     import { createAIProvider } from '@email-ia/ai-provider';
     const p = createAIProvider({ provider: 'ollama', baseUrl: 'http://localhost:11434' });
     await p.pullModel('llama3.2:3b', ({ completed, total, status }) =>
       console.log(completed, total),
     );
     ```
   - **Filesystem** (URL directa https):
     ```ts
     await mgr.pullModel('https://huggingface.co/.../model.gguf', onProgress);
     // lanza ProviderError si name no es URL: "pullModel local requiere URL https://"
     ```
3. Verificar ruta:
   ```ts
   const path = await mgr.getModelPath('model.gguf'); // string | null
   ```
4. Eliminar:
   ```ts
   await mgr.removeModel('model.gguf'); // unlinkSync, ProviderError si no existe
   ```
5. Llamafile embebido (opcional):
   ```ts
   import { LlamafileRuntime } from '@email-ia/ai-provider';
   const rt = new LlamafileRuntime({
     binaryPath: './bin/llamafile',
     modelPath: './models/model.gguf',
     port: 8080,
   });
   await rt.start(); // poll 5 s hasta healthCheck GET /v1/models
   await rt.healthCheck(); // boolean
   await rt.stop();
   ```

## Validación

- `pnpm test:coverage -- packages/ai-provider` verde (72 tests, `fs`/`fetch`/`spawn` mockeados, sin red/disco real).
- `filesystem-model-manager.test.ts` cubre `body.getReader` vs `arrayBuffer` fallback y `content-length`.
- `providerError` con `code`/`status` si falla descarga/tamaño.

## Recuperación

- `ProviderError: modelo no encontrado`: verificar `modelsDir` y `getModelPath` (basename sanitizado).
- `pullModel HTTP <status>` o `fallo de descarga`: reintentar con URL válida https; para `OpenAICompatibleProvider` el pull no está soportado (error explícito) — usar `ollama` o filesystem URL.
- `LlamafileRuntime` no arranca (`existsSync` false o `spawn` falla): validar `binaryPath`/`modelPath` existen; `getServerUrl()` debe ser `http://host:port/v1`.
- Espacio insuficiente: `sizeBytes` en `listLocalModels` para decidir cuantización; `suggestQuantization()` pendiente (ADR-005).

## Referencias

- `ADR-002` §IA/LLM, `ADR-003` (`ProviderError`), `ADR-005` (runtime + gestor + factory), `ARCHITECTURE_DECISIONS.md:3.7`.

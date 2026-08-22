import { ProviderError } from '@email-ia/core';
import type { LocalModelInfo, ModelManagerPort, PullProgressCallback } from '@email-ia/core';
import * as nodeFs from 'node:fs';
import * as nodePath from 'node:path';

export type FetchLike = (url: string | URL, init?: RequestInit) => Promise<Response>;
export type FsLike = Pick<
  typeof nodeFs,
  'existsSync' | 'readdirSync' | 'statSync' | 'unlinkSync' | 'mkdirSync' | 'createWriteStream'
> & {
  // allow mocked subset
  existsSync: (p: string) => boolean;
  readdirSync: (p: string) => string[];
  statSync: (p: string) => { size: number; isFile: () => boolean };
  unlinkSync: (p: string) => void;
  mkdirSync: (p: string, opts?: unknown) => void;
  createWriteStream: (p: string) => NodeJS.WritableStream & { close: (cb?: () => void) => void };
};

export interface FilesystemModelManagerOptions {
  modelsDir: string;
  fetchImpl?: FetchLike;
  fsImpl?: Partial<FsLike> | undefined;
  pathImpl?: Pick<typeof nodePath, 'join' | 'basename'> | undefined;
}

function sanitizeName(name: string): string {
  const trimmed = name.trim();
  if (!trimmed) throw new ProviderError('pullModel: name es obligatorio');
  // allow file-like or hf id; keep last segment
  return trimmed;
}

export class FilesystemModelManager implements ModelManagerPort {
  private readonly modelsDir: string;
  private readonly fetchImpl: FetchLike;
  private readonly fs: FsLike;
  private readonly path: Pick<typeof nodePath, 'join' | 'basename'>;

  constructor(options: FilesystemModelManagerOptions) {
    if (!options.modelsDir) throw new ProviderError('modelsDir es obligatorio');
    this.modelsDir = options.modelsDir;
    this.fetchImpl = options.fetchImpl ?? (globalThis.fetch as unknown as FetchLike);
    this.fs = (options.fsImpl as FsLike) ?? (nodeFs as unknown as FsLike);
    this.path = options.pathImpl ?? nodePath;
    // ensure dir exists (lazy)
    try {
      if (!this.fs.existsSync(this.modelsDir))
        this.fs.mkdirSync(this.modelsDir, { recursive: true });
    } catch {
      // ignore (mocked fs may throw)
    }
  }

  async listLocalModels(): Promise<LocalModelInfo[]> {
    let entries: string[] = [];
    try {
      entries = this.fs.readdirSync(this.modelsDir);
    } catch {
      return [];
    }
    const out: LocalModelInfo[] = [];
    for (const entry of entries) {
      const full = this.path.join(this.modelsDir, entry);
      try {
        const st = this.fs.statSync(full);
        if (!st.isFile()) continue;
        out.push({ id: entry, path: full, sizeBytes: st.size });
      } catch {
        continue;
      }
    }
    return out;
  }

  async getModelPath(name: string): Promise<string | null> {
    const id = sanitizeName(name);
    const candidate = this.path.join(this.modelsDir, this.path.basename(id));
    // direct file
    if (this.fs.existsSync(candidate)) return candidate;
    // try with exact name as file (hf id -> maybe file exists)
    const alt = this.path.join(this.modelsDir, id);
    if (this.fs.existsSync(alt)) return alt;
    return null;
  }

  async removeModel(name: string): Promise<void> {
    const p = await this.getModelPath(name);
    if (!p) throw new ProviderError(`modelo no encontrado: ${name}`);
    this.fs.unlinkSync(p);
  }

  async pullModel(name: string, onProgress?: PullProgressCallback): Promise<LocalModelInfo> {
    const id = sanitizeName(name);
    // If name is an URL, download from it; otherwise treat as filename and require fetch to succeed only if URL
    // For local tests we support http(s):// URL as pull source; plain name returns error directing to URL or Ollama
    const isUrl = /^https?:\/\//.test(id);
    if (!isUrl) {
      // For non-URL, we simulate local creation via placeholder for testing environments
      // In production, this would delegate to Ollama or hf hub; here we throw guidance
      throw new ProviderError(
        'pullModel local requiere URL https:// del modelo GGUF; usa OllamaProvider para pulls de Ollama',
      );
    }
    const fileName = this.path.basename(new URL(id).pathname) || 'model.gguf';
    const dest = this.path.join(this.modelsDir, fileName);
    const response = await this.fetchImpl(new URL(id), { method: 'GET' });
    if (!response.ok || !response.body) {
      throw new ProviderError(`pullModel HTTP ${response.status}`, response.status);
    }
    // stream to file if possible, else fallback
    const totalHeader = response.headers.get('content-length');
    const total = totalHeader ? Number(totalHeader) : undefined;
    let completed = 0;
    try {
      // Use Node streaming when available
      const reader = response.body.getReader?.();
      if (reader && this.fs.createWriteStream) {
        const ws = this.fs.createWriteStream(dest) as unknown as {
          write: (c: Uint8Array) => void;
          close: (cb?: () => void) => void;
          on: (e: string, cb: (err: Error) => void) => void;
        };
        // Bridge WHATWG reader to ws
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          if (value) {
            completed += value.length;
            (ws as unknown as { write?: (c: Uint8Array) => void }).write?.(value);
            if (total !== undefined) onProgress?.({ completed, total, status: 'downloading' });
            else onProgress?.({ completed, status: 'downloading' });
          }
        }
        await new Promise<void>((resolve, reject) => {
          try {
            // mocked streams may not have close callback
            const maybe = (ws as unknown as { close: (cb: () => void) => void }).close;
            if (maybe) maybe(() => resolve());
            else resolve();
          } catch (e) {
            reject(e as Error);
          }
        });
      } else {
        // fallback: buffer
        const buf = await response.arrayBuffer();
        completed = buf.byteLength;
        onProgress?.({ completed, total: completed, status: 'downloading' });
        // cannot write without ws; for mocked fs we just return info
        // try Node fs writeFileSync if available
        const maybeFs = this.fs as unknown as {
          writeFileSync?: (p: string, d: Uint8Array) => void;
        };
        if (maybeFs.writeFileSync) maybeFs.writeFileSync(dest, new Uint8Array(buf));
      }
    } catch (e) {
      if (e instanceof ProviderError) throw e;
      throw new ProviderError(`pullModel fallo de descarga: ${(e as Error).message}`);
    }
    const statSize = (() => {
      try {
        return this.fs.statSync(dest).size;
      } catch {
        return completed;
      }
    })();
    return { id: fileName, path: dest, sizeBytes: statSize };
  }
}

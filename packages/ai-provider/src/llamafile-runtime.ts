import { ProviderError } from '@email-ia/core';
import * as nodeFs from 'node:fs';
import * as nodeChild from 'node:child_process';

export type FetchLike = (url: string | URL, init?: RequestInit) => Promise<Response>;
export type SpawnLike = (
  command: string,
  args: string[],
  options?: unknown,
) => {
  pid?: number;
  on: (ev: string, cb: (...a: unknown[]) => void) => void;
  kill: (sig?: string) => void;
  unref?: () => void;
};

export interface LlamafileRuntimeConfig {
  binaryPath: string;
  modelPath: string;
  host?: string | undefined; // default 127.0.0.1
  port?: number | undefined; // default 8080
  args?: string[] | undefined;
}

export interface LlamafileRuntimeDeps {
  fetchImpl?: FetchLike | undefined;
  fsImpl?: Pick<typeof nodeFs, 'existsSync'> | undefined;
  spawnImpl?: SpawnLike | undefined;
}

export class LlamafileRuntime {
  private readonly config: {
    binaryPath: string;
    modelPath: string;
    host: string;
    port: number;
    args: string[];
  };
  private readonly fetchImpl: FetchLike;
  private readonly fs: Pick<typeof nodeFs, 'existsSync'>;
  private readonly spawnImpl: SpawnLike;
  private child: ReturnType<SpawnLike> | null = null;

  constructor(config: LlamafileRuntimeConfig, deps: LlamafileRuntimeDeps = {}) {
    if (!config.binaryPath) throw new ProviderError('binaryPath es obligatorio');
    if (!config.modelPath) throw new ProviderError('modelPath es obligatorio');
    this.config = {
      binaryPath: config.binaryPath,
      modelPath: config.modelPath,
      host: config.host ?? '127.0.0.1',
      port: config.port ?? 8080,
      args: config.args ?? [],
    };
    this.fetchImpl = deps.fetchImpl ?? (globalThis.fetch as unknown as FetchLike);
    this.fs = deps.fsImpl ?? nodeFs;
    this.spawnImpl = deps.spawnImpl ?? (nodeChild.spawn as unknown as SpawnLike);
  }

  getServerUrl(): string {
    return `http://${this.config.host}:${this.config.port}/v1`;
  }

  isBinaryAvailable(): boolean {
    return this.fs.existsSync(this.config.binaryPath) && this.fs.existsSync(this.config.modelPath);
  }

  isRunning(): boolean {
    return this.child !== null;
  }

  async healthCheck(): Promise<boolean> {
    try {
      const res = await this.fetchImpl(new URL(`${this.getServerUrl()}/models`), {
        method: 'GET',
        signal: AbortSignal.timeout(5000),
      });
      return res.ok;
    } catch {
      return false;
    }
  }

  async start(): Promise<void> {
    if (this.isRunning()) return;
    if (!this.isBinaryAvailable()) {
      throw new ProviderError(
        `llamafile binario o modelo no encontrado: ${this.config.binaryPath}, ${this.config.modelPath}`,
      );
    }
    const args = [
      '--server',
      '--model',
      this.config.modelPath,
      '--host',
      this.config.host,
      '--port',
      String(this.config.port),
      ...this.config.args,
    ];
    this.child = this.spawnImpl(this.config.binaryPath, args, { stdio: 'ignore' });
    // wait briefly for health (poll up to 5s)
    const deadline = Date.now() + 5000;
    while (Date.now() < deadline) {
      if (await this.healthCheck()) return;
      await new Promise((r) => setTimeout(r, 200));
    }
    // still not healthy, but consider started (caller can poll)
  }

  async stop(): Promise<void> {
    if (!this.child) return;
    try {
      this.child.kill('SIGTERM');
    } finally {
      this.child = null;
    }
  }
}

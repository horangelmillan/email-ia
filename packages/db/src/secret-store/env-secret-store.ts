import type { SecretStorePort } from '@email-ia/core';

function keyFor(service: string, account: string): string {
  return `${service}__${account}`.toUpperCase().replace(/[^A-Z0-9_]/g, '_');
}

export class EnvSecretStore implements SecretStorePort {
  private readonly memory = new Map<string, string>();

  async getPassword(service: string, account: string): Promise<string | null> {
    const key = keyFor(service, account);
    const fromEnv = process.env[key];
    if (fromEnv !== undefined) return fromEnv;
    return this.memory.get(`${service}:${account}`) ?? null;
  }

  async setPassword(service: string, account: string, password: string): Promise<void> {
    this.memory.set(`${service}:${account}`, password);
  }

  async deletePassword(service: string, account: string): Promise<boolean> {
    return this.memory.delete(`${service}:${account}`);
  }
}

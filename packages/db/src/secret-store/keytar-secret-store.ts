import type { SecretStorePort } from '@email-ia/core';

type KeytarModule = {
  getPassword(service: string, account: string): Promise<string | null>;
  setPassword(service: string, account: string, password: string): Promise<void>;
  deletePassword(service: string, account: string): Promise<boolean>;
};

export class KeytarSecretStore implements SecretStorePort {
  constructor(
    private readonly keytar: KeytarModule,
    private readonly fallback: SecretStorePort,
  ) {}

  async getPassword(service: string, account: string): Promise<string | null> {
    try {
      const value = await this.keytar.getPassword(service, account);
      if (value !== null) return value;
    } catch {
      // fall through to fallback (SO store not available in this env)
    }
    return this.fallback.getPassword(service, account);
  }

  async setPassword(service: string, account: string, password: string): Promise<void> {
    try {
      await this.keytar.setPassword(service, account, password);
      return;
    } catch {
      await this.fallback.setPassword(service, account, password);
    }
  }

  async deletePassword(service: string, account: string): Promise<boolean> {
    try {
      const deleted = await this.keytar.deletePassword(service, account);
      if (deleted) return true;
    } catch {
      // fall through
    }
    return this.fallback.deletePassword(service, account);
  }
}

export { EnvSecretStore } from './env-secret-store.js';

export async function createSecretStore(): Promise<import('@email-ia/core').SecretStorePort> {
  try {
    // keytar es dependencia opcional nativa; puede no estar instalada en CI/tests
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore - keytar types optional
    const keytar = (await import('keytar')) as unknown as {
      getPassword(s: string, a: string): Promise<string | null>;
      setPassword(s: string, a: string, p: string): Promise<void>;
      deletePassword(s: string, a: string): Promise<boolean>;
    };
    const { EnvSecretStore } = await import('./env-secret-store.js');
    const fallback = new EnvSecretStore();
    const { KeytarSecretStore } = await import('./keytar-secret-store.js');
    return new KeytarSecretStore(keytar, fallback);
  } catch {
    const { EnvSecretStore } = await import('./env-secret-store.js');
    return new EnvSecretStore();
  }
}

import { createAIProvider, ProviderError } from '@email-ia/ai-provider';
import { coreName } from '@email-ia/core';
import { dbName } from '@email-ia/db';
import { SHARED_PACKAGE } from '@email-ia/shared';

export const BACKEND_PACKAGE = '@email-ia/backend' as const;

export function backendName(): string {
  return `${BACKEND_PACKAGE} integrates ${coreName()}, ${dbName()}, AI provider and ${SHARED_PACKAGE}`;
}

export function makeProvider(baseUrl: string) {
  try {
    return createAIProvider({ baseUrl });
  } catch (error) {
    if (error instanceof ProviderError) {
      return undefined;
    }
    throw error;
  }
}

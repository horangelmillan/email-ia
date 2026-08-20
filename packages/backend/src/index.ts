import { aiProviderName } from '@email-ia/ai-provider';
import { coreName } from '@email-ia/core';
import { dbName } from '@email-ia/db';
import { SHARED_PACKAGE } from '@email-ia/shared';

export const BACKEND_PACKAGE = '@email-ia/backend' as const;

export function backendName(): string {
  return `${BACKEND_PACKAGE} integrates ${coreName()}, ${dbName()}, ${aiProviderName()} and ${SHARED_PACKAGE}`;
}

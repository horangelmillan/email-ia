export const SHARED_PACKAGE = '@email-ia/shared' as const;

export function identity<T>(value: T): T {
  return value;
}

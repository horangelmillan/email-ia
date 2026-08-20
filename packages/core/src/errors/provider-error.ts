import { AppError } from './app-error.js';

export class ProviderError extends AppError {
  constructor(message: string, status?: number) {
    super(message, 'PROVIDER_ERROR', status === undefined ? {} : { status });
    this.name = 'ProviderError';
  }
}

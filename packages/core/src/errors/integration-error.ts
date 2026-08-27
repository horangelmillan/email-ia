import { AppError } from './app-error.js';

export class IntegrationError extends AppError {
  constructor(message: string, status?: number, details?: unknown) {
    const opts: { status?: number; details?: unknown } = {};
    if (status !== undefined) opts.status = status;
    if (details !== undefined) opts.details = details;
    if (Object.keys(opts).length === 0) {
      super(message, 'INTEGRATION_ERROR');
    } else {
      super(message, 'INTEGRATION_ERROR', opts);
    }
    this.name = 'IntegrationError';
  }
}

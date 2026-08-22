import { AppError } from './app-error.js';

export class DbError extends AppError {
  constructor(message: string, details?: unknown) {
    super(message, 'DB_ERROR', details === undefined ? {} : { details });
    this.name = 'DbError';
  }
}

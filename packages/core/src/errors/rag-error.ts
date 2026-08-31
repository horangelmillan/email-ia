import { AppError } from './app-error.js';

export class RagError extends AppError {
  constructor(message: string, details?: unknown) {
    if (details === undefined) {
      super(message, 'RAG_ERROR', { status: 400 });
    } else {
      super(message, 'RAG_ERROR', { status: 400, details });
    }
    this.name = 'RagError';
  }
}

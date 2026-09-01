import { AppError } from './app-error.js';

export class PromptError extends AppError {
  constructor(message: string, details?: unknown) {
    if (details === undefined) {
      super(message, 'PROMPT_ERROR', { status: 400 });
    } else {
      super(message, 'PROMPT_ERROR', { status: 400, details });
    }
    this.name = 'PromptError';
  }
}

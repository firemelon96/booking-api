// errors/ConflictError.ts

import { AppError } from './app-error';

export class ConflictError extends AppError {
  constructor(message: string) {
    super(409, 'CONFLICT', message);
  }
}

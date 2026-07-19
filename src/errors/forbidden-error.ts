// errors/ForbiddenError.ts

import { AppError } from './app-error';

export class ForbiddenError extends AppError {
  constructor(message = 'Forbidden') {
    super(403, 'FORBIDDEN', message);
  }
}

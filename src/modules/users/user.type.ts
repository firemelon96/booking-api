import z from 'zod';
import { userQuerySchema } from './user.validation';

export type UserQueryInput = z.infer<typeof userQuerySchema>;

import z from 'zod';
import { adminWarningSchema } from './admin-warning.validator';

export type AdminWarningType = z.infer<typeof adminWarningSchema>;

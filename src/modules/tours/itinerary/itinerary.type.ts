import z from 'zod';
import { daysSchema } from './itinerary.validator';

export type ItineraryType = z.infer<typeof daysSchema>;

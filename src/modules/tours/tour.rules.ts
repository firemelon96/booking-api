import { CapacityMode, TourType } from '../../generated/prisma/browser';

export function validateBaseTourRules(input: {
  type: TourType;
  durationDays?: number;
  capacityMode: CapacityMode;
}) {
  const { type, durationDays, capacityMode } = input;

  if (type === 'DAY' && durationDays && durationDays > 1) {
    throw new Error('Invalid duration for day tour');
  }

  if (type === 'PACKAGE' && durationDays && durationDays <= 1) {
    throw new Error('Invalid duration for package tour');
  }

  if (!['EXCLUSIVE', 'SHARED', 'MIXED'].includes(capacityMode)) {
    throw new Error('Invalid capacity mode');
  }
}

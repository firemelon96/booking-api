export type TransferInventoryInput = {
  transferId: string;
  travelDate: Date;
  scheduleId?: string;
  maxPassengers: number;
  passengers: number;
  isAdmin: boolean;
  userId: string;
};

import { NextFunction, Request } from 'express';
import { transferIdParams } from '../transfer.validator';
// import { setInventorySchema } from './inventory.validator';
// import { setInventoryService } from './inventory.service';

// export async function setInventoryController(
//   req: Request,
//   res: Response,
//   next: NextFunction,
// ) {
//   const params = transferIdParams.safeParse(req.params);

//   if (!params.success) {
//     throw new Error('Invalid params');
//   }

//   const payload = setInventorySchema.safeParse(req.body);

//   if (!payload.success) {
//     throw new Error('Invalid fields');
//   }

//   try {
//     const inventory = await setInventoryService();

//     res.json(inventory);
//   } catch (error) {
//     next(error);
//   }
// }

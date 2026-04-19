import app from './app';
import { env } from './config/env';
import { expirePendingBooking } from './cron/expire-pending-booking';
import { startImageCleanupJob } from './cron/image-cleanup';

app.listen(env.PORT, () => {
  console.log(`Server running on Port ${env.PORT}`);
});

startImageCleanupJob();
expirePendingBooking();

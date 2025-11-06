import cron from 'node-cron';
import { prisma } from './db';
// import { sendNotification } from './notifier'; // Commented out - notifier module not implemented

// Placeholder scheduler - implement when notifier is ready
export function startScheduler() {
  // Schedule tasks here when notifier is implemented
  // cron.schedule('* * * * *', async () => {
  //   const alerts = await prisma.alert.findMany({ where: { schedule: { not: null } } });
  //   for (const alert of alerts) {
  //     const should = await evaluateAlert(alert);
  //     if (should) {
  //       await sendNotification(alert);
  //     }
  //   }
  // });
}

// Placeholder function
async function evaluateAlert(alert: any): Promise<boolean> {
  // Implement evaluation logic
  return false;
}

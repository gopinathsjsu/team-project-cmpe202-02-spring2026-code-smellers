import cron from "node-cron";
import { sendPendingRsvpPromptEmails, sendUpcomingReminderEmails } from "./ticketNotification.service";

let schedulerStarted = false;

export function startNotificationScheduler(): void {
  if (schedulerStarted) {
    return;
  }
  schedulerStarted = true;

  cron.schedule("*/15 * * * *", () => {
    void sendPendingRsvpPromptEmails();
    void sendUpcomingReminderEmails();
  });
}
import app from "./app";
import { startNotificationScheduler } from "./services/notificationScheduler";

const PORT = process.env.PORT || 3000;
const notificationSchedulerEnabled =
  process.env.NOTIFICATION_SCHEDULER_ENABLED === "true";

app.listen(PORT, () => {
  if (notificationSchedulerEnabled) {
    startNotificationScheduler();
  }

  console.log(`Server running on port ${PORT}`);
});

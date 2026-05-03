import app from "./app";
import { startNotificationScheduler } from "./services/notificationScheduler";

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  startNotificationScheduler();
  console.log(`Server running on port ${PORT}`);
});
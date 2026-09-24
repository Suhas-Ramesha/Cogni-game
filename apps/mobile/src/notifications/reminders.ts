import { isRunningInExpoGo } from 'expo';

type NotificationsModule = typeof import('expo-notifications');

let notificationsReady: Promise<NotificationsModule | null> | null = null;

function loadNotifications() {
  if (isRunningInExpoGo()) return Promise.resolve(null);
  notificationsReady ??= import('expo-notifications').then((Notifications) => {
    Notifications.setNotificationHandler({
      handleNotification: async () => ({
        shouldShowAlert: true,
        shouldPlaySound: true,
        shouldSetBadge: false,
        shouldShowBanner: true,
        shouldShowList: true,
      }),
    });
    return Notifications;
  });
  return notificationsReady;
}

export async function ensureNotificationPermission() {
  const Notifications = await loadNotifications();
  if (!Notifications) return false;
  const current = await Notifications.getPermissionsAsync();
  if (current.granted) return true;
  const asked = await Notifications.requestPermissionsAsync();
  return asked.granted;
}

export async function scheduleReminder(input: {
  title: string;
  body: string;
  when: Date;
  repeats?: boolean;
}) {
  const Notifications = await loadNotifications();
  if (!Notifications) return null;
  await ensureNotificationPermission();
  return Notifications.scheduleNotificationAsync({
    content: { title: input.title, body: input.body, sound: true },
    trigger: input.repeats
      ? {
          type: Notifications.SchedulableTriggerInputTypes.DAILY,
          hour: input.when.getHours(),
          minute: input.when.getMinutes(),
        }
      : {
          type: Notifications.SchedulableTriggerInputTypes.DATE,
          date: input.when,
        },
  });
}

export async function cancelReminder(id: string) {
  const Notifications = await loadNotifications();
  if (!Notifications) return;
  await Notifications.cancelScheduledNotificationAsync(id);
}

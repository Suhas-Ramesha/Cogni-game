type NotificationsModule = typeof import('expo-notifications');

let notificationsReady: Promise<NotificationsModule> | null = null;

function loadNotifications() {
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
  await ensureNotificationPermission();
  const id = await Notifications.scheduleNotificationAsync({
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
  return id;
}

export async function cancelReminder(id: string) {
  const Notifications = await loadNotifications();
  await Notifications.cancelScheduledNotificationAsync(id);
}

import * as Notifications from 'expo-notifications';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

export async function ensureNotificationPermission() {
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
  await Notifications.cancelScheduledNotificationAsync(id);
}

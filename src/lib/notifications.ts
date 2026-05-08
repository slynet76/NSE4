import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

const KEY_HOUR = 'notif:hour';
const KEY_MIN = 'notif:min';
const KEY_ENABLED = 'notif:enabled';
const CHANNEL = 'daily-lesson';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

export async function ensurePermissions(): Promise<boolean> {
  if (!Device.isDevice) return false;
  const settings = await Notifications.getPermissionsAsync();
  if (settings.granted) return true;
  const req = await Notifications.requestPermissionsAsync();
  return req.granted;
}

async function ensureChannel() {
  if (Platform.OS !== 'android') return;
  await Notifications.setNotificationChannelAsync(CHANNEL, {
    name: 'Leçon quotidienne',
    importance: Notifications.AndroidImportance.HIGH,
    vibrationPattern: [0, 250, 250, 250],
    lightColor: '#3b82f6',
  });
}

export async function getReminder(): Promise<{ hour: number; minute: number; enabled: boolean }> {
  const [h, m, e] = await Promise.all([
    AsyncStorage.getItem(KEY_HOUR),
    AsyncStorage.getItem(KEY_MIN),
    AsyncStorage.getItem(KEY_ENABLED),
  ]);
  return {
    hour: h ? parseInt(h, 10) : 19,
    minute: m ? parseInt(m, 10) : 0,
    enabled: e === null ? true : e === '1',
  };
}

export async function scheduleDailyReminder(hour: number, minute: number, enabled: boolean) {
  await AsyncStorage.multiSet([
    [KEY_HOUR, String(hour)],
    [KEY_MIN, String(minute)],
    [KEY_ENABLED, enabled ? '1' : '0'],
  ]);
  await Notifications.cancelAllScheduledNotificationsAsync();
  if (!enabled) return;
  const ok = await ensurePermissions();
  if (!ok) return;
  await ensureChannel();
  await Notifications.scheduleNotificationAsync({
    content: {
      title: 'Ta leçon NSE4 du jour',
      body: '5 minutes pour avancer. Garde le streak !',
      sound: 'default',
    },
    trigger: {
      hour,
      minute,
      repeats: true,
      channelId: CHANNEL,
    },
  });
}

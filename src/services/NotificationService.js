import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

// Configure notification behavior when app is in foreground
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

const REMINDER_NOTIFICATION_ID = 'wealthflow_daily_reminder';

export const NotificationService = {
  /**
   * Request permission to send push / local notifications
   */
  async requestPermissions() {
    if (Platform.OS === 'web') return false;
    try {
      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;
      if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }
      return finalStatus === 'granted';
    } catch (e) {
      console.warn('Notification permission error:', e);
      return false;
    }
  },

  /**
   * Schedule daily recurring reminder to add expenses
   * @param {number} hour 0-23 (e.g. 20 for 8 PM)
   * @param {number} minute 0-59 (e.g. 0)
   */
  async scheduleDailyReminder(hour = 20, minute = 0) {
    if (Platform.OS === 'web') return false;
    try {
      const granted = await this.requestPermissions();
      if (!granted) return false;

      // Cancel any previous reminder first to avoid duplicates
      await this.cancelDailyReminder();

      await Notifications.scheduleNotificationAsync({
        identifier: REMINDER_NOTIFICATION_ID,
        content: {
          title: 'WealthFlow Daily Reminder 💰',
          body: 'Remember to record today\'s expenses and income to keep your balance up to date!',
          sound: true,
          priority: Notifications.AndroidNotificationPriority.HIGH,
        },
        trigger: {
          type: Notifications.SchedulableTriggerInputTypes?.DAILY || 'daily',
          hour,
          minute,
          repeats: true,
        },
      });

      return true;
    } catch (e) {
      console.warn('Failed to schedule daily reminder:', e);
      return false;
    }
  },

  /**
   * Cancel scheduled daily reminder
   */
  async cancelDailyReminder() {
    if (Platform.OS === 'web') return;
    try {
      await Notifications.cancelScheduledNotificationAsync(REMINDER_NOTIFICATION_ID);
    } catch (e) {
      console.warn('Failed to cancel reminder:', e);
    }
  },

  /**
   * Send an instant test notification to demonstrate it works
   */
  async sendTestNotification() {
    if (Platform.OS === 'web') return false;
    try {
      const granted = await this.requestPermissions();
      if (!granted) return false;

      await Notifications.scheduleNotificationAsync({
        content: {
          title: 'WealthFlow Notifications Active! 🔔',
          body: 'Daily reminders are configured and working perfectly.',
          sound: true,
          priority: Notifications.AndroidNotificationPriority.HIGH,
        },
        trigger: null, // deliver immediately
      });
      return true;
    } catch (e) {
      console.warn('Failed to send test notification:', e);
      return false;
    }
  },
};

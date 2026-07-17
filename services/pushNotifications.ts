import { useState, useEffect, useRef } from 'react';
import { Platform } from 'react-native';
import Constants from 'expo-constants';

/**
 * Push Notifications Service
 * 
 * IMPORTANT: expo-notifications is imported DYNAMICALLY (not at top level)
 * because starting from SDK 53, the module throws an error when loaded
 * inside Expo Go. By importing lazily inside useEffect, we avoid the
 * module-level side-effect (DevicePushTokenAutoRegistration) that crashes.
 * 
 * Push notifications will only work in a Development Build or production build.
 */

// We store a reference so we can set the notification handler once
let notificationHandlerSet = false;

export function usePushNotifications(isLoggedIn: boolean) {
  const [expoPushToken, setExpoPushToken] = useState('');
  const notificationListenerRef = useRef<any>(null);
  const responseListenerRef = useRef<any>(null);

  useEffect(() => {
    if (!isLoggedIn) return;

    // Skip push notifications entirely in Expo Go
    if (Constants.appOwnership === 'expo') {
      console.log('⚠️ Push notifications are not supported in Expo Go (SDK 53+). Use a development build.');
      return;
    }

    let isMounted = true;

    (async () => {
      try {
        // Dynamic import to avoid module-level crash in Expo Go
        const Notifications = await import('expo-notifications');
        const Device = await import('expo-device');

        if (!isMounted) return;

        // Set notification handler once
        if (!notificationHandlerSet) {
          Notifications.setNotificationHandler({
            handleNotification: async () => ({
              shouldShowAlert: true,
              shouldPlaySound: true,
              shouldSetBadge: false,
              shouldShowBanner: true,
              shouldShowList: true,
            }),
          });
          notificationHandlerSet = true;
        }

        // Register for push notifications
        const token = await registerForPushNotificationsAsync(Notifications, Device);
        if (token && isMounted) {
          setExpoPushToken(token);
          // Send to backend
          try {
            const api = (await import('./api')).default;
            await api.post('/api/auth/register-push-token', { pushToken: token });
          } catch (err: any) {
            console.log('Failed to register push token:', err);
          }
        }

        // Set up notification listeners
        notificationListenerRef.current = Notifications.addNotificationReceivedListener(notification => {
          console.log('Notification received:', notification);
        });

        responseListenerRef.current = Notifications.addNotificationResponseReceivedListener(response => {
          console.log('Notification clicked:', response);
        });
      } catch (e) {
        console.log('Push notifications setup failed (expected in Expo Go):', e);
      }
    })();

    return () => {
      isMounted = false;
      if (notificationListenerRef.current) {
        notificationListenerRef.current.remove();
      }
      if (responseListenerRef.current) {
        responseListenerRef.current.remove();
      }
    };
  }, [isLoggedIn]);

  return { expoPushToken };
}

async function registerForPushNotificationsAsync(Notifications: any, Device: any) {
  let token;

  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('default', {
      name: 'default',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#FF231F7C',
    });
  }

  if (Platform.OS === 'web') {
    console.log('Push notifications are not supported on web yet.');
    return null;
  }

  if (Device.isDevice) {
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;
    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }
    if (finalStatus !== 'granted') {
      console.log('Failed to get push token for push notification!');
      return;
    }
    try {
      token = (await Notifications.getExpoPushTokenAsync()).data;
      console.log('Expo Push Token:', token);
    } catch (e) {
      console.log('Push token error:', e);
      token = `${e}`;
    }
  } else {
    console.log('Must use physical device for Push Notifications');
  }

  return token;
}

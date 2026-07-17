# Walkthrough: Clearing Expo Notifications Error

I have updated the push notification service to prevent the fatal error in **Expo Go** while maintaining support for push notifications in **Development Builds**.

## Changes Made

### Push Notification Service
#### [pushNotifications.ts](file:///C:/Users/chand/StudioProjects/Tenant-PGMS/services/pushNotifications.ts)
- Imported `Constants` and `ExecutionEnvironment` from `expo-constants`.
- Added a conditional check at the top level to only call `Notifications.setNotificationHandler` when not in Expo Go.
- Modified `registerForPushNotificationsAsync` to return early with a warning if the app is running in Expo Go (`ExecutionEnvironment.StoreClient`).

```typescript
// Example of the check added:
if (Constants.executionEnvironment === ExecutionEnvironment.StoreClient) {
  console.warn('Push notifications are not supported in Expo Go (SDK 53+). Please use a development build.');
  return null;
}
```

## Verification Results

### Code Review
- The code now safely handles the environment check before interacting with the `expo-notifications` library, which is the root cause of the error message you received.
- This change allows the app to boot and function normally in Expo Go for all other features (UI, Auth, etc.).

> [!NOTE]
> You will still see a warning in the console when the app starts, but it will no longer be a fatal error that prevents development. To actually use push notifications, you'll eventually need to transition to a [Development Build](https://docs.expo.dev/develop/development-builds/introduction/).

# Plan: Clear Expo Notifications Error in Expo Go

The error `expo-notifications: Android Push notifications ... removed from Expo Go` occurs because Expo SDK 53+ no longer supports remote push notifications within the standard Expo Go app. To fix this, you either need to use a **Development Build** or disable the notification logic when running in Expo Go.

## Proposed Changes

### [Component] Push Notification Service

#### [MODIFY] [pushNotifications.ts](file:///C:/Users/chand/StudioProjects/Tenant-PGMS/services/pushNotifications.ts)
- Add a check for the execution environment using `expo-constants`.
- Guard all `expo-notifications` calls and initialization logic so they only run when **not** in Expo Go (i.e., in a standalone app or development build).
- Provide a safe fallback for the `usePushNotifications` hook so the rest of the app continues to function in Expo Go without crashing.

## User Review Required

> [!IMPORTANT]
> This change will suppress the error and allow you to continue developing in **Expo Go**, but **push notifications will not work** while using Expo Go.
> To test push notifications, you will eventually need to:
> 1. Install `expo-dev-client`.
> 2. Create a development build (using `npx expo run:android` or EAS Build).

## Verification Plan

### Manual Verification
1. Run the app in Expo Go.
2. Verify that the console no longer shows the fatal `expo-notifications` error.
3. Verify that the app loads successfully to the login/main screen.

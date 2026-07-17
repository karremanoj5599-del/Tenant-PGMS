# Plan: Debug and Fix Networking Failure

The "networking failure" is likely caused by the mobile app being unable to reach the backend server IP. This happens if the IP address detection is incorrect for the current environment (Physical Device vs Emulator) or if the backend server is not running on the expected port.

## User Review Required

> [!IMPORTANT]
> Please ensure that your backend server is running. You can start it by opening a terminal in the `backend` folder and running:
> ```bash
> npm run dev
> ```
> Also, if you are using a **physical phone**, ensure it is on the same Wi-Fi network as your computer.

## Proposed Changes

### [Component] Frontend Configuration

#### [MODIFY] [Config.ts](file:///C:/Users/chand/StudioProjects/Tenant-PGMS/constants/Config.ts)
- Improve the host detection logic to handle more Expo edge cases.
- Add a console log to help the user see exactly what URL the app is trying to connect to.
- Ensure the IP `192.168.1.106` (your current machine IP) is used as a fallback if other detection methods fail on a physical device.

### [Component] API Service Layer

#### [MODIFY] [api.ts](file:///C:/Users/chand/StudioProjects/Tenant-PGMS/services/api.ts)
- Add basic logging to the `request` function to log the full URL being fetched. This will help identify if the URL is incorrect during debugging.

## Verification Plan

### Manual Verification
1. Open the mobile app.
2. Check the console/terminal logs for the message "📡 API Base URL: ...".
3. Verify if that URL matches your computer's IP and port 3001.
4. Try to log in again.

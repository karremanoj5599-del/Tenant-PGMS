# Walkthrough: Fixing Networking and Adding Debug Logs

I have updated the networking configuration to be more resilient and added logs to help track down connectivity issues between the mobile app and the backend.

## Changes Made

### Networking Configuration
#### [Config.ts](file:///C:/Users/chand/StudioProjects/Tenant-PGMS/constants/Config.ts)
- Set the default host to your machine's IP (`192.168.1.106`) if Expo's automatic detection fails. This is critical for physical devices.
- Added a `console.log` that prints the `API Base URL` every time the app starts.
- Simplified the fallback URL logic to use the detected host directly.

### API Request Logging
#### [api.ts](file:///C:/Users/chand/StudioProjects/Tenant-PGMS/services/api.ts)
- Added a `console.log` inside the `request` function to show the exact URL being called for every API request.
- This will show up in your Metro terminal as: `🌐 Fetching: http://192.168.1.106:3001/api/auth/login`.

## Verification

### How to Debug
1. Look at your **Metro terminal** (where you run `npx expo start`).
2. When the app starts, look for: `📡 API Base URL: http://192.168.1.106:3001/api`.
3. When you tap "Sign In", look for: `🌐 Fetching: http://192.168.1.106:3001/api/auth/login`.

> [!IMPORTANT]
> If you see `localhost` or `127.0.0.1` in the "Fetching" log while using a **physical phone**, it will fail. The logs I added will help you confirm if the IP is being detected correctly.
>
> If the IP is correct but it still fails, check if you can open `http://192.168.1.106:3001/api/health` in your computer's browser. If that works but the phone fails, it's likely a **Firewall** or **Wi-Fi isolation** issue.

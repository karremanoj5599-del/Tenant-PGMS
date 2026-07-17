# Walkthrough: Fixing Login and API Connectivity

I have corrected several configuration mismatches between the frontend and backend that were preventing the app from logging in and fetching data.

## Changes Made

### Frontend Configuration
#### [Config.ts](file:///C:/Users/chand/StudioProjects/Tenant-PGMS/constants/Config.ts)
- Updated the backend port from `5000` to `3001` to match the `server.js` configuration.
- Removed the `/tenant` suffix from the `API_BASE` URL to align with the backend's routing structure.

### API Service Layer
#### [api.ts](file:///C:/Users/chand/StudioProjects/Tenant-PGMS/services/api.ts)
- Updated `getDashboard()` to use the `/dashboard/overview` endpoint.
- Updated `createTicket()` to use the `/tickets/create` endpoint.
- Changed `updatePin()` method from `PUT` to `POST` to match the backend route.

### Backend Database Configuration
#### [database.js](file:///C:/Users/chand/StudioProjects/Tenant-PGMS/backend/db/database.js)
- Changed the default `dbType` from `supabase` to `sqlite`. This ensures the app works out-of-the-box using the local database.
- Corrected the SQLite database path to point to `backend/data/tenant_pgms.db`.

## Verification

### Ready for Login
The app is now configured to talk to your local backend correctly.

> [!IMPORTANT]
> To verify:
> 1. Ensure your backend is running:
>    ```bash
>    cd backend
>    npm run dev
>    ```
> 2. Open the mobile app and log in with:
>    - Mobile: `9876543210`
>    - PIN: `1234`

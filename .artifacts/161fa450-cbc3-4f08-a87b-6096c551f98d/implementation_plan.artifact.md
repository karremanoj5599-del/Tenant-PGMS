# Plan: Fix App Login and API Connectivity

The app is failing to log in because of a configuration mismatch between the frontend and the backend. Specifically, the frontend is trying to connect to the wrong port and using incorrect API path segments.

## User Review Required

> [!IMPORTANT]
> I have identified that the backend server runs on port **3001** by default, but the frontend was configured to use port **5000**. I will also correct the API path from `/api/tenant/` to `/api/` to match the backend routes.

## Proposed Changes

### [Component] Frontend Configuration

#### [MODIFY] [Config.ts](file:///C:/Users/chand/StudioProjects/Tenant-PGMS/constants/Config.ts)
- Change the fallback port from `5000` to `3001`.
- Update the default `API_BASE` path to remove the `/tenant` suffix, as the backend routes are prefixed with `/api/auth`, `/api/dashboard`, etc.

### [Component] API Service Layer

#### [MODIFY] [api.ts](file:///C:/Users/chand/StudioProjects/Tenant-PGMS/services/api.ts)
- Update service functions to match the actual backend endpoints:
    - Change `getDashboard()` to use `/dashboard/overview`.
    - Change `createTicket()` to use `/tickets/create`.
    - Change `updatePin()` to use `/auth/update-pin`.
    - Change `scanMessQR()` to use `/mess/scan`.

### [Component] Backend Configuration

#### [MODIFY] [database.js](file:///C:/Users/chand/StudioProjects/Tenant-PGMS/backend/db/database.js)
- Change the default `dbType` to `sqlite` to allow local development without immediate Cloud setup.
- Correct the SQLite database path to point to `backend/data/tenant_pgms.db`.

## Verification Plan

### Manual Verification
1. Start the backend server (`cd backend && npm run dev`).
2. Attempt to log in with the demo credentials:
   - Mobile: `9876543210`
   - PIN: `1234`
3. Verify that the dashboard loads after login.

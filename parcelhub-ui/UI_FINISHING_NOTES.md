# ParcelHub UI finishing notes

This archive contains the complete `parcelhub-ui` source project with the shared UI finishing layer.

## Run on Windows
```powershell
npm install
npm run dev
```

Run these commands from the `parcelhub-ui` directory. Start the Spring Boot backend separately.

## Production build check
```powershell
npm run build
```

The archive omits `node_modules`, build outputs, and Git metadata to make downloading much faster. All frontend source files, configuration files, package manifests, and lockfiles from the original UI project are retained.


## Stage 1 — route estimate improvements
- Added stale-response protection so older geocoding/routing responses cannot overwrite newer addresses.
- Invalidates estimates when route-related inputs change, preventing booking against an old estimate.
- Added clearer route status feedback, full-address guidance, a swap-locations action, and a Google Maps driving-directions link.
- Existing Spring Boot OSRM/Nominatim route calculation remains the source of distance and route time.


## Stage 3 — Notification center
- Added an interactive notification center to the customer dashboard bell.
- Displays shipment status and payment status updates from the latest parcel data.
- Added unread counts, mark-all-read, per-item read state persisted in localStorage per account, and links to the parcel tracking page.
- Dashboard data refreshes in the background every 60 seconds while open. Notifications are in-app dashboard updates; this stage does not send email, SMS, or push notifications.

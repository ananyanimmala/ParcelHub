ParcelHub UI finishing notes


## Stage 2 — Demo checkout and payment confirmation
- Added a clearly-labelled simulated checkout for UPI, card, and net-banking selections. It does not request real payment credentials and does not charge money.
- Added authenticated `POST /api/parcels/{id}/demo-payment`, restricted to the parcel owner or an admin, to persist `PaymentStatus.PAID`.
- Cash on delivery skips online checkout and leaves payment due on delivery.
- The UI shows the tracking number and a success tick after the backend confirms the simulated payment.


## Stage 4 — Authentication experience
- Added responsive auth styling, keyboard focus states, reduced-motion support, and improved input focus feedback.
- Replaced the login page fake password-reset alert with a dismissible inline notice that clearly explains password reset is not configured.
- Existing registration/login API requests and role-based redirects remain intact.


## Stage 5 — Smart tracking and operations
- Added persistent proof-of-delivery fields (recipient, optional note, timestamp) to Parcel. Hibernate ddl-auto=update adds the columns to existing local databases.
- Added authenticated DELIVERY_AGENT/ADMIN endpoint POST /api/parcels/{id}/proof-of-delivery; it only completes parcels currently OUT_FOR_DELIVERY and writes a DELIVERED tracking event.
- Agent dashboard now asks for recipient confirmation before completing a delivery. This records text proof details only; no photo/signature capture is implemented.
- Tracking page includes a QR code for the tracking URL, proof-of-delivery receipt, and clearly labelled illustrative CO2e estimate based on road distance. QR image generation uses a third-party online QR service.
- Admin overview adds a live shipment status breakdown and network distance/illustrative emissions metrics.


## Stage 6 — Tracking layout and share link
- Fixed tracking page grid placement so shipment activity and smart tracking cards use the full content width rather than squeezing QR and eco cards into the narrow side column.
- Added a Share tracking link action using the browser share sheet where supported, with clipboard fallback.
- Added tablet/mobile breakpoints for a clean single-column layout.

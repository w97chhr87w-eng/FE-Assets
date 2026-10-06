# Facilities Parts — Version 1

This is a mobile-friendly prototype for:
- Parts inventory
- Low-stock tracking
- Parts requests
- Faulty-part reports
- Issuing parts
- Request status workflow
- Activity history

## Important
This first package uses browser local storage, so it is a **single-phone prototype**. It is not yet shared between users.

To make it genuinely shared for up to 5 people while keeping it free, the next step is to connect the app to a free cloud database such as Supabase and add simple user login/roles.

## Suggested shared workflow
Requester → Request → Admin approves → Storekeeper issues → Completed.

## Data fields already included
Parts:
- name/description
- part number
- category
- quantity
- minimum stock
- storage location
- supplier

Requests:
- part
- quantity
- requester
- location/equipment
- reason
- status
- date/time

Fault reports:
- part
- equipment/location
- reporter
- description
- status
- date/time

# EMTS Frontend

EMTS is a frontend-only Event Management and Ticketing System demo built with Next.js App Router and TypeScript. It includes separate role-based portals for Customer, Organizer, Venue Staff, Admin, and Corporate Client, with mocked APIs and Java-friendly DTO/service thinking for future Spring Boot integration.

## What is included

- Landing page with EMTS branding and animated wordmark treatment
- Role selector and separate login portals for all five roles
- Customer flows for discovery, event details, checkout, payment states, QR tickets, purchase history, cancellation and refund visibility, and notifications
- Organizer flows for event management, ticket category and refund policy controls, VIP and staff allocation states, bulk bookings, reports, revenue and occupancy charts, live attendance, and budget vs expenses
- Venue staff mobile-first scan screen with camera mock, manual QR fallback, validation results, duplicate handling, and attendance controls
- Admin portal for user management, role assignment UI, settings, refund defaults, system monitoring, logs, reports, and security audit views
- Corporate client portal for bulk booking request, payment link state, GST and invoice summary, receive tickets state, and booking history
- Dark and light mode theme toggle
- Mock JSON seed data aligned to future backend contracts

## Tech stack

- Next.js 15
- React 19
- TypeScript
- Framer Motion
- Recharts
- Lucide React

## Project structure

- `app`
- `components`
- `modules/auth`
- `modules/customer`
- `modules/organizer`
- `modules/staff`
- `modules/admin`
- `modules/corporate`
- `services`
- `mock-data`
- `types`
- `utils`
- `styles`
- `public/assets`

## Demo credentials

Any password works in the mocked UI. The login forms are prefilled with demo emails for each portal:

- Customer: `riya@emts.demo`
- Organizer: `aarav@emts.demo`
- Staff: `neha@emts.demo`
- Admin: `admin@emts.demo`
- Corporate Client: `corporate@emts.demo`

Admin and Organizer include a mock 2FA step.

## Local development

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## GitHub push

```bash
git init
git add .
git commit -m "Add EMTS frontend demo"
git branch -M main
git remote add origin <your-repo-url>
git push -u origin main
```

## Vercel deployment

1. Push this repository to GitHub.
2. Import the repository into Vercel.
3. Keep the framework preset as `Next.js`.
4. Deploy without adding backend environment variables.

`vercel.json` is included for straightforward framework detection.

## Future Java integration notes

- Mock data contracts map cleanly to backend entities such as `User`, `Event`, `TicketCategory`, `Ticket`, `Booking`, `Payment`, `Refund`, `RefundPolicy`, `EntryScanLog`, `Notification`, and `Expense`.
- Service layer files under `services/` are intentionally shaped like frontend gateways that can later call Spring Boot controllers or microservices.
- Request/response DTO naming follows Java-oriented boundaries, especially around authentication, checkout, and bulk booking.

## Important note

The workspace did not include the referenced SRS and diagram files, so this implementation strictly follows the detailed role model, flows, entities, statuses, and refund logic provided in the prompt. If you add the original documents later, the route flows and UI copy can be tightened further against those exact artifacts.

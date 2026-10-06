# StudioSpace: A Web-Based Studio Booking, Availability, and Rental Payment Management System

Prototype for CTADWEBL. **No database yet**: data lives in memory and resets when the server restarts. Sample data is seeded on every start.

## Run it (two terminals)

```bash
# Terminal 1: API on http://localhost:5000
cd server
cp .env.example .env
npm install
npm run dev

# Terminal 2: React app on http://localhost:5173
cd client
cp .env.example .env
npm install
npm run dev
```

## Pages (10)
Landing, Dashboard, Studios, Studio Details, Booking Calendar, New Booking, Edit Booking, Renters, Payments, Revenue and Utilization Reports.

## Business rules
- **Double-booking prevention:** a booking is rejected if the studio, or an add-on's available units, is already taken for any overlapping hour.
- **Pricing:** hours x rate (hours from 17:00 are peak) + add-ons - loyalty discount. Loyalty is Silver (2+ completed bookings, 5%) or Gold (4+, 10%).
- **Status flow:** pending -> confirmed -> paid -> completed. Pending or confirmed can be cancelled. "Paid" needs a zero balance. Cancelling needs no recorded payments.
- **Payments:** only on confirmed, paid or completed bookings, and never more than the balance due. A full payment moves a confirmed booking to paid.
- **Overdue:** a billable booking whose date has passed with a balance due.

## API (base `/api`)
| Method | Path | Purpose |
|---|---|---|
| GET/POST | /renters | List (with tier and balance) / create |
| GET/PUT/DELETE | /renters/:id | Get / update / delete |
| GET | /renters/:id/summary | Tier, total billed, paid, balance, overdue count |
| GET/POST | /studios | List / create |
| GET/PUT/DELETE | /studios/:id | Get / update / delete |
| GET | /studios/:id/availability?date= | Hour-by-hour free and booked slots |
| GET/POST | /equipment | List / create add-ons |
| PUT/DELETE | /equipment/:id | Update / delete |
| GET/POST | /bookings | List (filters: date, studioId, renterId, status, overdue, hasBalance) / create |
| GET/PUT/DELETE | /bookings/:id | Get / update / delete |
| POST | /bookings/quote | Price preview and clash check without saving |
| PATCH | /bookings/:id/status | Rule-based status change |
| GET/POST | /payments | List / record a payment |
| DELETE | /payments/:id | Delete a payment |
| GET | /reports/overview | Totals, collected, outstanding, counts by status |
| GET | /reports/utilization | Booked vs open hours (last 14 days) and revenue per studio |
| GET | /reports/revenue-by-month | Collected per month |
| GET | /reports/overdue | Overdue bookings |

## Adding MongoDB later
Replace `server/src/store.js` and the array operations in `routes/` and `lib/` with Mongoose models (Renters, Studios, Equipment, Bookings, Payments).

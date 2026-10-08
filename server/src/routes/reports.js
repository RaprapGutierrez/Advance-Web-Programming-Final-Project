const router = require('express').Router();
const { db } = require('../store');
const B = require('../lib/bookings');
const { r2 } = require('../lib/pricing');

const active = () => db.bookings.filter((b) => b.status !== 'cancelled').map(B.hydrate);
router.get('/overview', (req, res) => {
  const all = db.bookings.map(B.hydrate);
  const live = all.filter((b) => b.status !== 'cancelled');
  const byStatus = {};
  all.forEach((b) => { byStatus[b.status] = (byStatus[b.status] || 0) + 1; });
  res.json({
    bookings: all.length, renters: db.renters.length, studios: db.studios.length, byStatus,
    booked: r2(live.reduce((s, b) => s + b.total, 0)),
    collected: r2(db.payments.reduce((s, p) => s + p.amount, 0)),
    outstanding: r2(live.filter((b) => B.BILLABLE.includes(b.status)).reduce((s, b) => s + b.balanceDue, 0)),
    overdueCount: all.filter((b) => b.overdue).length,
  });
});
// Utilization over the last 14 days (booked hours / open hours) plus revenue per studio
router.get('/utilization', (req, res) => {
  const today = B.todayStr();
  const from = new Date(Date.now() - 13 * 86400000 - new Date().getTimezoneOffset() * 60000).toISOString().slice(0, 10);
  res.json(db.studios.map((s) => {
    const mine = active().filter((b) => b.studioId === s.id);
    const bookedHours = mine.filter((b) => b.date >= from && b.date <= today).reduce((sum, b) => sum + b.hours, 0);
    const availableHours = 14 * (s.closeHour - s.openHour);
    return { studioId: s.id, name: s.name, type: s.type, bookings: mine.length, bookedHours, availableHours, utilization: Math.round((bookedHours / availableHours) * 1000) / 10, revenue: r2(mine.reduce((sum, b) => sum + b.paid, 0)) };
  }).sort((a, b) => b.revenue - a.revenue));
});
router.get('/revenue-by-month', (req, res) => {
  const m = {};
  db.payments.forEach((p) => { const k = p.date.slice(0, 7); m[k] = r2((m[k] || 0) + p.amount); });
  res.json(Object.entries(m).sort(([a], [b]) => a.localeCompare(b)).slice(-6).map(([month, total]) => ({ month, total })));
});
router.get('/overdue', (req, res) => res.json(db.bookings.map(B.hydrate).filter((b) => b.overdue).sort((a, b) => a.date.localeCompare(b.date))));
module.exports = router;

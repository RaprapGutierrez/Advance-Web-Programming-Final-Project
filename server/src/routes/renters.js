const router = require('express').Router();
const { db, uid } = require('../store');
const HttpError = require('../lib/HttpError');
const { find } = require('../lib/helpers');
const B = require('../lib/bookings');
const { r2 } = require('../lib/pricing');

function hydrate(r) {
  const mine = db.bookings.filter((b) => b.renterId === r.id).map(B.hydrate);
  const done = B.completedCount(r.id);
  const t = B.tierFor(done);
  return { ...r, tier: t.tier, discountRate: t.rate, completedBookings: done, bookings: mine.length, balanceDue: r2(mine.filter((b) => B.BILLABLE.includes(b.status)).reduce((s, b) => s + b.balanceDue, 0)) };
}
function clean(b, id) {
  const name = String(b.name || '').trim(), email = String(b.email || '').trim().toLowerCase(), phone = String(b.phone || '').trim();
  if (name.length < 2) throw new HttpError(400, 'Name must be at least 2 characters');
  if (!/^\S+@\S+\.\S+$/.test(email)) throw new HttpError(400, 'A valid email is required');
  if (phone.length < 7) throw new HttpError(400, 'A valid phone number is required');
  if (db.renters.some((r) => r.email === email && r.id !== id)) throw new HttpError(400, 'Email is already registered');
  return { name, email, phone };
}
router.get('/', (req, res) => res.json(db.renters.map(hydrate)));
router.get('/:id', (req, res) => res.json(hydrate(find(db.renters, req.params.id, 'Renter'))));
// Processing: loyalty tier, spend and balance for one renter
router.get('/:id/summary', (req, res) => {
  const r = hydrate(find(db.renters, req.params.id, 'Renter'));
  const mine = db.bookings.filter((b) => b.renterId === r.id && b.status !== 'cancelled').map(B.hydrate);
  res.json({ renterId: r.id, tier: r.tier, discountRate: r.discountRate, totalBilled: r2(mine.reduce((s, b) => s + b.total, 0)), totalPaid: r2(mine.reduce((s, b) => s + b.paid, 0)), balanceDue: r.balanceDue, hoursBooked: mine.reduce((s, b) => s + b.hours, 0), overdueBookings: mine.filter((b) => b.overdue).length });
});
router.post('/', (req, res) => { const r = { id: uid(), ...clean(req.body) }; db.renters.push(r); res.status(201).json(hydrate(r)); });
router.put('/:id', (req, res) => { const r = find(db.renters, req.params.id, 'Renter'); Object.assign(r, clean(req.body, r.id)); res.json(hydrate(r)); });
router.delete('/:id', (req, res) => {
  const r = find(db.renters, req.params.id, 'Renter');
  if (db.bookings.some((b) => b.renterId === r.id)) throw new HttpError(400, 'This renter has bookings. Delete or cancel them first.');
  db.renters.splice(db.renters.indexOf(r), 1);
  res.json({ message: 'Renter deleted' });
});
module.exports = router;

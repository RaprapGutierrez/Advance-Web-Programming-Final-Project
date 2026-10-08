const router = require('express').Router();
const { db, uid } = require('../store');
const HttpError = require('../lib/HttpError');
const { find } = require('../lib/helpers');
const B = require('../lib/bookings');

// Status flow: pending -> confirmed -> paid -> completed (cancel allowed before payment)
const FLOW = { pending: ['confirmed', 'cancelled'], confirmed: ['paid', 'cancelled'], paid: ['completed'], completed: [], cancelled: [] };

router.get('/', (req, res) => {
  const { date, studioId, renterId, status, overdue, hasBalance } = req.query;
  const list = db.bookings.map(B.hydrate).filter((b) =>
    (!date || b.date === date) && (!studioId || b.studioId === studioId) && (!renterId || b.renterId === renterId) &&
    (!status || b.status === status) && (overdue !== 'true' || b.overdue) &&
    (hasBalance !== 'true' || (B.BILLABLE.includes(b.status) && b.balanceDue > 0)));
  res.json(list.sort((a, b) => a.date.localeCompare(b.date) || a.startHour - b.startHour));
});
// Processing: price preview and conflict check without saving
router.post('/quote', (req, res) => {
  const existing = req.body.bookingId ? db.bookings.find((b) => b.id === req.body.bookingId) : undefined;
  const { fields } = B.validate(req.body, existing);
  const { hours, peakHours, subtotal, addOns, discountRate, discount, total } = fields;
  res.json({ hours, peakHours, offPeakHours: hours - peakHours, subtotal, addOns, discountRate, discount, total });
});
router.get('/:id', (req, res) => res.json(B.hydrate(find(db.bookings, req.params.id, 'Booking'))));
router.post('/', (req, res) => {
  const { fields } = B.validate(req.body);
  const b = { id: uid(), status: 'pending', ...fields };
  db.bookings.push(b);
  res.status(201).json(B.hydrate(b));
});
router.put('/:id', (req, res) => {
  const b = find(db.bookings, req.params.id, 'Booking');
  if (!['pending', 'confirmed'].includes(b.status)) throw new HttpError(400, 'Only pending or confirmed bookings can be edited');
  const { fields } = B.validate(req.body, b);
  if (B.paidOf(b.id) > fields.total) throw new HttpError(400, 'New total is lower than what was already paid');
  res.json(B.hydrate(Object.assign(b, fields)));
});
router.patch('/:id/status', (req, res) => {
  const b = find(db.bookings, req.params.id, 'Booking');
  const next = req.body.status;
  if (!FLOW[next]) throw new HttpError(400, 'Status must be pending, confirmed, paid, completed or cancelled');
  if (!FLOW[b.status].includes(next)) throw new HttpError(400, `A ${b.status} booking cannot become ${next}`);
  const h = B.hydrate(b);
  if (next === 'paid' && h.balanceDue > 0) throw new HttpError(400, `Record the remaining payment of ₱${h.balanceDue.toFixed(2)} first`);
  if (next === 'cancelled' && h.paid > 0) throw new HttpError(400, 'Remove recorded payments before cancelling');
  b.status = next;
  res.json(B.hydrate(b));
});
router.delete('/:id', (req, res) => {
  const b = find(db.bookings, req.params.id, 'Booking');
  db.bookings.splice(db.bookings.indexOf(b), 1);
  db.payments = db.payments.filter((p) => p.bookingId !== b.id);
  res.json({ message: 'Booking deleted' });
});
module.exports = router;

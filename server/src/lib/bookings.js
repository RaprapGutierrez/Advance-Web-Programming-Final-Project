const { db } = require('../store');
const HttpError = require('./HttpError');
const { quote, r2 } = require('./pricing');

const todayStr = () => new Date(Date.now() - new Date().getTimezoneOffset() * 60000).toISOString().slice(0, 10);
const hourLabel = (h) => `${String(h).padStart(2, '0')}:00`;
const paidOf = (id) => r2(db.payments.filter((p) => p.bookingId === id).reduce((s, p) => s + p.amount, 0));
const completedCount = (renterId, excludeId) => db.bookings.filter((b) => b.renterId === renterId && b.status === 'completed' && b.id !== excludeId).length;
const tierFor = (n) => (n >= 4 ? { tier: 'Gold', rate: 0.1 } : n >= 2 ? { tier: 'Silver', rate: 0.05 } : { tier: 'Standard', rate: 0 });
const BILLABLE = ['confirmed', 'paid', 'completed'];

function hydrate(b) {
  const paid = paidOf(b.id);
  const balanceDue = r2(b.total - paid);
  return {
    ...b,
    renterName: db.renters.find((r) => r.id === b.renterId)?.name ?? 'Deleted renter',
    studioName: db.studios.find((s) => s.id === b.studioId)?.name ?? 'Deleted studio',
    equipmentNames: b.equipmentIds.map((id) => db.equipment.find((e) => e.id === id)?.name).filter(Boolean),
    paid, balanceDue,
    overdue: BILLABLE.includes(b.status) && b.date < todayStr() && balanceDue > 0,
  };
}

// Validates a booking request and prevents double-booking of studios and equipment.
function validate(body, existing) {
  const renter = db.renters.find((r) => r.id === body.renterId);
  if (!renter) throw new HttpError(400, 'Choose a valid renter');
  const studio = db.studios.find((s) => s.id === body.studioId);
  if (!studio) throw new HttpError(400, 'Choose a valid studio');
  const date = String(body.date || '');
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || Number.isNaN(new Date(date).getTime())) throw new HttpError(400, 'A valid date is required');
  if ((!existing || existing.date !== date) && date < todayStr()) throw new HttpError(400, 'Bookings cannot be placed in the past');
  const start = Number(body.startHour), end = Number(body.endHour);
  if (!Number.isInteger(start) || !Number.isInteger(end)) throw new HttpError(400, 'Choose a start and end hour');
  if (end <= start) throw new HttpError(400, 'End time must be after the start time');
  if (start < studio.openHour || end > studio.closeHour) throw new HttpError(400, `${studio.name} is open ${hourLabel(studio.openHour)} to ${hourLabel(studio.closeHour)}`);
  const guests = Number(body.guests);
  if (!Number.isInteger(guests) || guests < 1) throw new HttpError(400, 'Guests must be at least 1');
  if (guests > studio.capacity) throw new HttpError(400, `${studio.name} fits at most ${studio.capacity} people`);
  const equipmentIds = [...new Set(Array.isArray(body.equipmentIds) ? body.equipmentIds : [])];
  const others = db.bookings.filter((b) => b.id !== existing?.id && b.status !== 'cancelled' && b.date === date && start < b.endHour && end > b.startHour);
  const clash = others.find((b) => b.studioId === studio.id);
  if (clash) throw new HttpError(400, `${studio.name} is already booked ${hourLabel(clash.startHour)} to ${hourLabel(clash.endHour)}`);
  for (const id of equipmentIds) {
    const eq = db.equipment.find((e) => e.id === id);
    if (!eq) throw new HttpError(400, 'One or more add-ons do not exist');
    if (others.filter((b) => b.equipmentIds.includes(id)).length >= eq.quantity) throw new HttpError(400, `${eq.name} is fully booked for that time`);
  }
  const loyalty = tierFor(completedCount(renter.id, existing?.id));
  return { renter, studio, fields: { renterId: renter.id, studioId: studio.id, date, startHour: start, endHour: end, guests, equipmentIds, discountRate: loyalty.rate, ...quote(studio, start, end, equipmentIds, loyalty.rate) } };
}
module.exports = { hydrate, validate, todayStr, hourLabel, paidOf, completedCount, tierFor, BILLABLE };
